"""
Cross-Dataset Reconciliation and Entity Linking Module.
Connects Recommended, Sanctioned, Expenditure, Completion, Allocation, and Calamity.
Constructs canonical normalized master tables and produces reconciliation metrics.
"""

from typing import Dict, Any, Tuple
import pandas as pd
from backend.pipeline.cleaning import normalize_mp_name, clean_text

def reconcile_and_build_masters(
    df_recommended: pd.DataFrame,
    df_sanctioned: pd.DataFrame,
    df_expenditure: pd.DataFrame,
    df_completed: pd.DataFrame,
    df_allocation: pd.DataFrame,
    df_calamity: pd.DataFrame
) -> Tuple[Dict[str, pd.DataFrame], Dict[str, Any]]:
    """
    Perform reconciliation and construct canonical tables for database loading.
    Returns dictionary of master DataFrames and reconciliation metrics dictionary.
    """
    
    # 1. MP Master Table
    allocation = df_allocation.copy()
    allocation["mp_key"] = allocation["mp_name"].apply(normalize_mp_name)
    
    mp = allocation[["mp_key", "mp_name", "state", "constituency", "allocated_amount"]].copy()
    mp = mp.drop_duplicates(subset=["mp_key"], keep="first").reset_index(drop=True)
    mp.insert(0, "mp_id", range(1, len(mp) + 1))
    
    mp_lookup = dict(zip(mp["mp_key"], mp["mp_id"]))
    
    # 2. Work Master Table
    work = df_sanctioned.copy()
    work["mp_key"] = work["mp_name"].apply(normalize_mp_name)
    work["mp_id"] = work["mp_key"].map(mp_lookup)
    work = work.drop_duplicates(subset=["work_id"], keep="first").reset_index(drop=True)
    
    # 3. Expenditure Transactions
    exp = df_expenditure.copy()
    exp["mp_key"] = exp["mp_name"].apply(normalize_mp_name)
    exp["mp_id"] = exp["mp_key"].map(mp_lookup)
    if "transaction_id" not in exp.columns:
        exp.insert(0, "transaction_id", range(1, len(exp) + 1))
        
    # 4. Completion Table
    comp = df_completed.copy()
    comp["mp_key"] = comp["mp_name"].apply(normalize_mp_name)
    comp["mp_id"] = comp["mp_key"].map(mp_lookup)
    comp = comp.drop_duplicates(subset=["work_id"], keep="first").reset_index(drop=True)
    comp.insert(0, "completion_id", range(1, len(comp) + 1))
    
    # 5. Calamity Table
    calamity = df_calamity.copy()
    calamity["mp_key"] = calamity["mp_name"].apply(normalize_mp_name)
    calamity["mp_id"] = calamity["mp_key"].map(mp_lookup)
    calamity.insert(0, "consent_id", range(1, len(calamity) + 1))
    
    # Reconciliation Metrics
    sanctioned_ids = set(work["work_id"].dropna())
    expenditure_ids = set(exp["work_id"].dropna())
    completed_ids = set(comp["work_id"].dropna())
    
    exp_matched = expenditure_ids.intersection(sanctioned_ids)
    comp_matched = completed_ids.intersection(sanctioned_ids)
    
    calamity_mps = set(calamity["mp_key"].dropna())
    alloc_mps = set(mp["mp_key"].dropna())
    calamity_matched = calamity_mps.intersection(alloc_mps)
    
    metrics = {
        "sanctioned_works_count": len(sanctioned_ids),
        "expenditure_works_count": len(expenditure_ids),
        "expenditure_match_rate": round(len(exp_matched) / max(len(expenditure_ids), 1) * 100, 2),
        "expenditure_unmatched_count": len(expenditure_ids - sanctioned_ids),
        "completed_works_count": len(completed_ids),
        "completed_match_rate": round(len(comp_matched) / max(len(completed_ids), 1) * 100, 2),
        "completed_coverage_pct": round(len(comp_matched) / max(len(sanctioned_ids), 1) * 100, 2),
        "total_allocation_mps": len(alloc_mps),
        "calamity_mps_count": len(calamity_mps),
        "calamity_mp_match_rate": round(len(calamity_matched) / max(len(calamity_mps), 1) * 100, 2),
        "total_expenditure_transactions": len(exp),
        "total_expenditure_amount": float(exp["fund_disbursed_amount"].sum()),
        "total_sanction_amount": float(work["sanction_amount"].sum()),
        "total_allocated_amount": float(mp["allocated_amount"].sum()),
        "total_calamity_amount": float(calamity["consent_amount"].sum())
    }
    
    tables = {
        "mp": mp,
        "work": work,
        "expenditure_transaction": exp,
        "completion": comp,
        "calamity_consent": calamity
    }
    
    return tables, metrics
