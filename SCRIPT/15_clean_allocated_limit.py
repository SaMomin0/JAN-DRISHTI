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

input_file = base_dir / "Allocated Limit for Honble MPs.csv"

if not input_file.exists():
    input_file = base_dir / "raw" / "Allocated Limit for Honble MPs.csv"

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = (
    output_dir / "Allocated_Limit_cleaned.csv"
)

if not input_file.exists():
    print("ERROR: Allocated Limit CSV not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Allocated Limit...")

df = pd.read_csv(
    input_file,
    dtype=str,
    low_memory=False
)

print(f"Raw rows: {len(df):,}")

# ============================================================
# REMOVE GRAND TOTAL IF PRESENT
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
    "State": "state",
    "Hon'ble Members of Parliaments": "mp_name",
    "Constituency": "constituency",
    "Allocated AMOUNT ( ₹ )": "allocated_amount"
})

# ============================================================
# TEXT CLEANING
# ============================================================

text_columns = [
    "state",
    "mp_name",
    "constituency"
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
# ALLOCATED AMOUNT
# ============================================================

df["allocated_amount"] = (
    df["allocated_amount"]
    .astype("string")
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.strip()
)

df["allocated_amount"] = pd.to_numeric(
    df["allocated_amount"],
    errors="coerce"
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

# ============================================================
# MP VALIDATION
# ============================================================

print("\n========== MP VALIDATION ==========")

print(
    f"Unique MP names: "
    f"{df['mp_name'].nunique():,}"
)

print(
    f"Missing MP names: "
    f"{df['mp_name'].isna().sum():,}"
)

# ============================================================
# CONSTITUENCY VALIDATION
# ============================================================

print("\n========== CONSTITUENCY VALIDATION ==========")

print(
    f"Unique constituencies: "
    f"{df['constituency'].nunique():,}"
)

print(
    f"Missing constituencies: "
    f"{df['constituency'].isna().sum():,}"
)

# ============================================================
# CHECK DUPLICATE MP NAMES
# ============================================================

mp_counts = df["mp_name"].value_counts()

print(
    f"\nMP names appearing more than once: "
    f"{(mp_counts > 1).sum():,}"
)

if (mp_counts > 1).any():

    print("\nDuplicate MP name examples:")

    print(
        mp_counts[mp_counts > 1]
        .head(20)
        .to_string()
    )

# ============================================================
# CHECK DUPLICATE CONSTITUENCIES
# ============================================================

const_counts = df["constituency"].value_counts()

print(
    f"\nConstituencies appearing more than once: "
    f"{(const_counts > 1).sum():,}"
)

if (const_counts > 1).any():

    print("\nDuplicate constituency examples:")

    print(
        const_counts[const_counts > 1]
        .head(20)
        .to_string()
    )

# ============================================================
# AMOUNT VALIDATION
# ============================================================

print("\n========== AMOUNT VALIDATION ==========")

print(
    f"Valid amounts: "
    f"{df['allocated_amount'].notna().sum():,}"
)

print(
    f"Missing amounts: "
    f"{df['allocated_amount'].isna().sum():,}"
)

if df["allocated_amount"].notna().any():

    print(
        f"Minimum amount: "
        f"₹{df['allocated_amount'].min():,.2f}"
    )

    print(
        f"Maximum amount: "
        f"₹{df['allocated_amount'].max():,.2f}"
    )

    print(
        f"Total allocated amount: "
        f"₹{df['allocated_amount'].sum():,.2f}"
    )

# ============================================================
# SAMPLE
# ============================================================

print("\n========== CLEANED SAMPLE ==========")

print(
    df[
        [
            "sr_no",
            "state",
            "mp_name",
            "constituency",
            "allocated_amount"
        ]
    ]
    .head(15)
    .to_string(index=False)
)

# ============================================================
# SAVE
# ============================================================

df.to_csv(
    output_file,
    index=False
)

print("\n========== COMPLETE ==========")

print("Cleaned file saved to:")
print(output_file)