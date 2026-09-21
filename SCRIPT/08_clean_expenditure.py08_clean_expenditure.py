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

input_file = (
    base_dir / "Expenditure on Completed and On-going Works as on Date.csv"
)

if not input_file.exists():
    input_file = (
        base_dir / "raw" /
        "Expenditure on Completed and On-going Works as on Date.csv"
    )

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "Expenditure_cleaned.csv"

if not input_file.exists():
    print("ERROR: Expenditure CSV not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Expenditure...")

df = pd.read_csv(
    input_file,
    dtype=str,
    low_memory=False
)

print(f"Raw rows: {len(df):,}")

# ============================================================
# REMOVE GRAND TOTAL FOOTER IF PRESENT
# ============================================================

before = len(df)

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
    "State": "state",
    "Work": "work",
    "Work ID": "work_id",
    "IDA": "ida",
    "Hon'ble Members of Parliament": "mp_name",
    "Constituency": "constituency",
    "Expenditure Date": "expenditure_date",
    "Vendor Name": "vendor_name",
    "Payment Status": "payment_status",
    "Fund Disbursed Amount ( ₹ )": "fund_disbursed_amount"
})

# ============================================================
# TEXT CLEANING
# ============================================================

text_columns = [
    "state",
    "work",
    "work_id",
    "ida",
    "mp_name",
    "constituency",
    "vendor_name",
    "payment_status"
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
# WORK ID CLEANING
# ============================================================

df["work_id"] = (
    df["work_id"]
    .str.replace(r"\s+", "", regex=True)
)

# ============================================================
# DATE
# ============================================================

df["expenditure_date"] = pd.to_datetime(
    df["expenditure_date"],
    format="%d-%b-%Y",
    errors="coerce"
)

# ============================================================
# AMOUNT
# ============================================================

df["fund_disbursed_amount"] = (
    df["fund_disbursed_amount"]
    .astype("string")
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.strip()
)

df["fund_disbursed_amount"] = pd.to_numeric(
    df["fund_disbursed_amount"],
    errors="coerce"
)

# ============================================================
# PAYMENT STATUS CLEANING
# ============================================================

df["payment_status"] = df["payment_status"].replace({
    "": pd.NA,
    "nan": pd.NA,
    "None": pd.NA
})

# ============================================================
# TRANSACTION ID
# ============================================================
#
# There is no transaction ID in the source.
# We therefore create a stable row-level identifier based
# on the cleaned row order.
#

df.insert(
    0,
    "expenditure_transaction_id",
    range(1, len(df) + 1)
)

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

print("\nWork ID validation:")

print(
    f"Unique Work IDs: "
    f"{df['work_id'].nunique():,}"
)

print(
    f"Missing Work IDs: "
    f"{df['work_id'].isna().sum():,}"
)

print("\nDate validation:")

print(
    f"Invalid/missing dates: "
    f"{df['expenditure_date'].isna().sum():,}"
)

print("\nAmount validation:")

print(
    f"Invalid/missing amounts: "
    f"{df['fund_disbursed_amount'].isna().sum():,}"
)

print(
    f"Total disbursed: "
    f"₹{df['fund_disbursed_amount'].sum():,.2f}"
)

print("\nPayment status:")

print(
    df["payment_status"]
    .value_counts(dropna=False)
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