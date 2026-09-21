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

input_file = base_dir / "Works Completed.csv"

if not input_file.exists():
    input_file = base_dir / "raw" / "Works Completed.csv"

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "Works Completed_cleaned.csv"

if not input_file.exists():
    print("ERROR: Works Completed.csv not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Works Completed...")

df = pd.read_csv(
    input_file,
    dtype=str,
    low_memory=False
)

print(f"Raw rows: {len(df):,}")

# ============================================================
# REMOVE GRAND TOTAL FOOTER IF PRESENT
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
    "Work Category": "work_category",
    "Work": "work",
    "State": "state",
    "IDA": "ida",
    "Work Description": "work_description",
    "Hon'ble Members of Parliament": "mp_name",
    "Constituency": "constituency",
    "Image": "image",
    "Completion Date": "completion_date",
    "Amount Disbursed ( ₹ )": "amount_disbursed"
})

# ============================================================
# TEXT CLEANING
# ============================================================

text_columns = [
    "work_category",
    "work",
    "state",
    "ida",
    "work_description",
    "mp_name",
    "constituency",
    "image"
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
# EXTRACT WORK ID FROM WORK
# ============================================================
#
# Example:
#
# WS/MP418/2024-2025/133409-Construction of roads...
#
# becomes:
#
# work_id = 133409
#

df["work_id"] = (
    df["work"]
    .str.extract(
        r"^WS/[^/]+/\d{4}-\d{4}/(\d+)-",
        expand=False
    )
)

# ============================================================
# COMPLETION DATE
# ============================================================

df["completion_date"] = pd.to_datetime(
    df["completion_date"],
    format="%d-%b-%Y",
    errors="coerce"
)

# ============================================================
# AMOUNT
# ============================================================

df["amount_disbursed"] = (
    df["amount_disbursed"]
    .astype("string")
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.strip()
)

df["amount_disbursed"] = pd.to_numeric(
    df["amount_disbursed"],
    errors="coerce"
)

# ============================================================
# RECORD TYPE
# ============================================================

df["record_type"] = "COMPLETED"

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
# WORK ID VALIDATION
# ============================================================

print("\n========== WORK ID VALIDATION ==========")

print(
    f"Work IDs found: "
    f"{df['work_id'].notna().sum():,}"
)

print(
    f"Missing Work IDs: "
    f"{df['work_id'].isna().sum():,}"
)

print(
    f"Unique Work IDs: "
    f"{df['work_id'].nunique():,}"
)

duplicate_ids = (
    df["work_id"]
    .duplicated()
    .sum()
)

print(
    f"Duplicate Work IDs: "
    f"{duplicate_ids:,}"
)

if df["work_id"].isna().sum() > 0:

    print("\nSample rows with missing Work ID:")

    print(
        df.loc[
            df["work_id"].isna(),
            ["work", "state", "mp_name"]
        ]
        .head(20)
        .to_string(index=False)
    )

# ============================================================
# DATE VALIDATION
# ============================================================

print("\n========== DATE VALIDATION ==========")

print(
    f"Valid completion dates: "
    f"{df['completion_date'].notna().sum():,}"
)

print(
    f"Invalid/missing completion dates: "
    f"{df['completion_date'].isna().sum():,}"
)

if df["completion_date"].notna().any():

    print(
        f"Minimum completion date: "
        f"{df['completion_date'].min()}"
    )

    print(
        f"Maximum completion date: "
        f"{df['completion_date'].max()}"
    )

# ============================================================
# AMOUNT VALIDATION
# ============================================================

print("\n========== AMOUNT VALIDATION ==========")

print(
    f"Valid amounts: "
    f"{df['amount_disbursed'].notna().sum():,}"
)

print(
    f"Missing amounts: "
    f"{df['amount_disbursed'].isna().sum():,}"
)

if df["amount_disbursed"].notna().any():

    print(
        f"Minimum amount: "
        f"₹{df['amount_disbursed'].min():,.2f}"
    )

    print(
        f"Maximum amount: "
        f"₹{df['amount_disbursed'].max():,.2f}"
    )

    print(
        f"Total amount disbursed: "
        f"₹{df['amount_disbursed'].sum():,.2f}"
    )

# ============================================================
# SAMPLE CLEANED DATA
# ============================================================

print("\n========== CLEANED SAMPLE ==========")

print(
    df[
        [
            "sr_no",
            "work_id",
            "work",
            "state",
            "mp_name",
            "constituency",
            "completion_date",
            "amount_disbursed"
        ]
    ]
    .head(10)
    .to_string(index=False)
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