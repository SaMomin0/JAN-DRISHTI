"""
Consolidated Cleaning Pipeline for MPLADS Data.
Implements exact, validated transformations across all six datasets:
- Removes "Grand Total" footer rows
- Normalizes column names
- Cleans whitespace and string artifacts
- Extracts canonical numeric work IDs
- Normalizes MP names (strips honorifics, titles, punctuation)
- Coerces and validates financial amounts
- Standardizes date formats (YYYY-MM-DD)
"""

import re
from pathlib import Path
from typing import Optional
import pandas as pd
import numpy as np

def clean_text(value: any) -> Optional[str]:
    """Strip string whitespace, handle NaN, None, and empty strings."""
    if pd.isna(value):
        return None
    val_str = str(value).strip()
    if val_str == "" or val_str.upper() in ["NAN", "NONE", "NULL", "NA", "N/A"]:
        return None
    return val_str

def normalize_mp_name(name: any) -> Optional[str]:
    """Standardize MP name for cross-dataset linking."""
    if pd.isna(name):
        return None
    name_str = str(name).upper().strip()
    # Remove punctuation
    name_str = re.sub(r"[^\w\s]", " ", name_str)
    # Common honorifics
    honorifics = ["SHRI", "SMT", "DR", "ADV", "PROF", "MR", "MRS", "MS", "SH."]
    for title in honorifics:
        name_str = re.sub(rf"\b{re.escape(title)}\b", " ", name_str)
    # Collapse whitespace
    name_str = re.sub(r"\s+", " ", name_str).strip()
    return name_str if name_str else None

def extract_work_id(value: any) -> Optional[str]:
    """Extract canonical numeric Work ID from varied formats."""
    if pd.isna(value):
        return None
    val_str = str(value).strip()
    if not val_str:
        return None
    # 1. Already purely numeric
    if re.fullmatch(r"\d+", val_str):
        return val_str
    # 2. Standard MPLADS format: .../<id>-... or .../<id>
    matches = re.findall(r"/(\d+)(?:-|$)", val_str)
    if matches:
        return matches[-1]
    # 3. Fallback: extract last contiguous digits
    matches = re.findall(r"(\d+)", val_str)
    if matches:
        return matches[-1]
    return None

def remove_grand_total(df: pd.DataFrame, sr_col: str = "Sr. No.") -> pd.DataFrame:
    """Remove footer grand total rows if present."""
    if sr_col in df.columns:
        mask = df[sr_col].astype(str).str.contains("Grand Total", case=False, na=False)
        return df[~mask].copy()
    return df.copy()

def parse_date(series: pd.Series) -> pd.Series:
    """Parse dates to YYYY-MM-DD string."""
    try:
        return pd.to_datetime(series, errors="coerce", format="mixed").dt.strftime("%Y-%m-%d")
    except Exception:
        return pd.to_datetime(series, errors="coerce").dt.strftime("%Y-%m-%d")

def clean_works_recommended(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Works Recommended dataset."""
    df = remove_grand_total(df_raw)
    df.columns = [
        "sr_no", "work_category", "work", "state", "ida",
        "mp_name", "constituency", "work_description",
        "recommended_date", "recommended_amount", "sanction_date"
    ]
    for c in ["sr_no", "work_category", "work", "state", "ida", "mp_name", "constituency", "work_description"]:
        df[c] = df[c].apply(clean_text)
    
    df["work_status"] = np.where(df["work"].astype(str).str.startswith("WS/"), "SANCTIONED", "RECOMMENDED")
    df["work_id"] = np.where(df["work_status"] == "SANCTIONED", df["work"].apply(extract_work_id), None)
    
    df["recommended_date"] = parse_date(df["recommended_date"])
    df["sanction_date"] = parse_date(df["sanction_date"])
    
    df["recommended_amount"] = pd.to_numeric(
        df["recommended_amount"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    return df

def clean_works_sanctioned(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Works Sanctioned dataset."""
    df = remove_grand_total(df_raw)
    df.columns = [
        "sr_no", "work_category", "work", "state", "ida",
        "mp_name", "constituency", "work_description",
        "recommended_date", "sanction_date", "sanction_amount", "work_status"
    ]
    for c in ["sr_no", "work_category", "work", "state", "ida", "mp_name", "constituency", "work_description", "work_status"]:
        df[c] = df[c].apply(clean_text)
        
    df["work_id"] = df["work"].apply(extract_work_id)
    df["recommended_date"] = parse_date(df["recommended_date"])
    df["sanction_date"] = parse_date(df["sanction_date"])
    df["sanction_amount"] = pd.to_numeric(
        df["sanction_amount"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    return df

def clean_expenditure(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Expenditure dataset."""
    df = remove_grand_total(df_raw)
    df.columns = [
        "sr_no", "state", "work", "work_id", "ida",
        "mp_name", "constituency", "expenditure_date",
        "vendor_name", "payment_status", "fund_disbursed_amount"
    ]
    for c in ["sr_no", "state", "work", "work_id", "ida", "mp_name", "constituency", "vendor_name", "payment_status"]:
        df[c] = df[c].apply(clean_text)
        
    df["work_id"] = df["work_id"].apply(extract_work_id)
    df["expenditure_date"] = parse_date(df["expenditure_date"])
    df["fund_disbursed_amount"] = pd.to_numeric(
        df["fund_disbursed_amount"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    df["transaction_id"] = range(1, len(df) + 1)
    return df

def clean_works_completed(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Works Completed dataset."""
    df = remove_grand_total(df_raw)
    df.columns = [
        "sr_no", "work_category", "work", "state", "ida",
        "work_description", "mp_name", "constituency",
        "image", "completion_date", "amount_disbursed"
    ]
    for c in ["sr_no", "work_category", "work", "state", "ida", "work_description", "mp_name", "constituency", "image"]:
        df[c] = df[c].apply(clean_text)
        
    df["work_id"] = df["work"].apply(extract_work_id)
    df["completion_date"] = parse_date(df["completion_date"])
    df["amount_disbursed"] = pd.to_numeric(
        df["amount_disbursed"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    return df

def clean_allocated_limit(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Allocated Limit for Honble MPs dataset."""
    df = remove_grand_total(df_raw)
    df.columns = ["sr_no", "state", "mp_name", "constituency", "allocated_amount"]
    for c in ["sr_no", "state", "mp_name", "constituency"]:
        df[c] = df[c].apply(clean_text)
        
    df["allocated_amount"] = pd.to_numeric(
        df["allocated_amount"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    return df

def clean_calamity_amount(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Clean Amount Consented for Calamity dataset."""
    df = remove_grand_total(df_raw)
    df.columns = ["sr_no", "calamity_type", "calamity_name", "mp_name", "consent_date", "consent_amount"]
    for c in ["sr_no", "calamity_type", "calamity_name", "mp_name"]:
        df[c] = df[c].apply(clean_text)
        
    df["consent_date"] = parse_date(df["consent_date"])
    df["consent_amount"] = pd.to_numeric(
        df["consent_amount"].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    df["record_type"] = "CALAMITY_CONSENT"
    return df
