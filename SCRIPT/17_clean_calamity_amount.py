
import sys
from pathlib import Path
import pandas as pd

# ============================================================
# UTF-8 OUTPUT
# ============================================================

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ============================================================
# PATHS
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

input_file = base_dir / "Amount consented for Calamity.csv"

if not input_file.exists():
    input_file = base_dir / "raw" / "Amount consented for Calamity.csv"

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = (
    output_dir / "Amount_consented_Calamity_cleaned.csv"
)

if not input_file.exists():
    print("ERROR: Amount consented for Calamity.csv not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Amount Consented for Calamity...")

df = pd.read_csv(
    input_file,
    dtype=str,
    low_memory=False
)

print(f"Raw rows: {len(df):,}")

# ============================================================
# REMOVE GRAND TOTAL
# ============================================================

grand_total_mask = (
    df["Sr. No."]
    .astype(str)
    .str.strip()
    .str.lower()
    .eq("grand total")
)

grand_total_count = grand_total_mask.sum()

if grand_total_count > 0:
    df = df.loc[~grand_total_mask].copy()

print(f"Grand Total rows removed: {grand_total_count}")
print(f"Rows after footer removal: {len(df):,}")

# ============================================================
# RENAME COLUMNS
# ============================================================

df = df.rename(columns={
    "Sr. No.": "sr_no",
    "Calamity Type": "calamity_type",
    "Calamity Name": "calamity_name",
    "Hon'ble Members of Parliament": "mp_name",
    "Date of Consent": "consent_date",
    "Consent Amount ( ₹ )": "consent_amount"
})

# ============================================================
# TEXT CLEANING
# ============================================================

text_columns = [
    "calamity_type",
    "calamity_name",
    "mp_name"
]

for col in text_columns:

    df[col] = (
        df[col]
        .astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

# ============================================================
# SERIAL NUMBER
# ============================================================

df["sr_no"] = pd.to_numeric(
    df["sr_no"],
    errors="coerce"
).astype("Int64")

# ============================================================
# DATE
# ============================================================

df["consent_date"] = pd.to_datetime(
    df["consent_date"],
    format="%d-%b-%Y",
    errors="coerce"
)

# ============================================================
# AMOUNT
# ============================================================

df["consent_amount"] = (
    df["consent_amount"]
    .astype("string")
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.strip()
)

df["consent_amount"] = pd.to_numeric(
    df["consent_amount"],
    errors="coerce"
)

# ============================================================
# RECORD TYPE
# ============================================================

df["record_type"] = "CALAMITY_CONSENT"

# ============================================================
# VALIDATION
# ============================================================

print("\n========== CLEANING VALIDATION ==========")

print(f"Final rows: {len(df):,}")
print(f"Final columns: {len(df.columns)}")

print("\nMissing values:")

missing = df.isna().sum()

print(
    missing[missing > 0]
    .sort_values(ascending=False)
)

print("\nDuplicate complete rows:")

print(
    f"Duplicate rows: "
    f"{df.duplicated().sum():,}"
)

# ============================================================
# CALAMITY VALIDATION
# ============================================================

print("\n========== CALAMITY VALIDATION ==========")

print(
    f"Unique calamity types: "
    f"{df['calamity_type'].nunique():,}"
)

print(
    f"Unique calamity names: "
    f"{df['calamity_name'].nunique():,}"
)

print(
    f"Unique MPs: "
    f"{df['mp_name'].nunique():,}"
)

# ============================================================
# DATE VALIDATION
# ============================================================

print("\n========== DATE VALIDATION ==========")

print(
    f"Valid consent dates: "
    f"{df['consent_date'].notna().sum():,}"
)

print(
    f"Invalid/missing dates: "
    f"{df['consent_date'].isna().sum():,}"
)

if df["consent_date"].notna().any():

    print(
        f"Minimum consent date: "
        f"{df['consent_date'].min()}"
    )

    print(
        f"Maximum consent date: "
        f"{df['consent_date'].max()}"
    )

# ============================================================
# AMOUNT VALIDATION
# ============================================================

print("\n========== AMOUNT VALIDATION ==========")

print(
    f"Valid consent amounts: "
    f"{df['consent_amount'].notna().sum():,}"
)

print(
    f"Invalid/missing amounts: "
    f"{df['consent_amount'].isna().sum():,}"
)

print(
    f"Total consent amount: "
    f"₹{df['consent_amount'].sum():,.2f}"
)

print(
    f"Minimum consent amount: "
    f"₹{df['consent_amount'].min():,.2f}"
)

print(
    f"Maximum consent amount: "
    f"₹{df['consent_amount'].max():,.2f}"
)

# ============================================================
# CALAMITY TYPE COUNTS
# ============================================================

print("\n========== CALAMITY TYPE COUNTS ==========")

print(
    df["calamity_type"]
    .value_counts()
    .to_string()
)

# ============================================================
# CALAMITY NAME COUNTS
# ============================================================

print("\n========== CALAMITY NAME COUNTS ==========")

print(
    df["calamity_name"]
    .value_counts()
    .to_string()
)

# ============================================================
# CLEANED SAMPLE
# ============================================================

print("\n========== CLEANED DATA ==========")

print(
    df.to_string(index=False)
)

# ============================================================
# SAVE
# ============================================================

df.to_csv(
    output_file,
    index=False,
    date_format="%Y-%m-%d"
)

print("\n========== COMPLETE ==========")

print("Cleaned file saved to:")
print(output_file)