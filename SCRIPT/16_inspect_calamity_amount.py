import sys
from pathlib import Path
import pandas as pd

# ============================================================
# UTF-8 OUTPUT
# ============================================================

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ============================================================
# PATH
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

file = base_dir / "Amount consented for Calamity.csv"

if not file.exists():
    file = base_dir / "raw" / "Amount consented for Calamity.csv"

if not file.exists():
    print("ERROR: Amount consented for Calamity.csv not found.")
    sys.exit(1)

print("File loaded from:")
print(file)

# ============================================================
# LOAD
# ============================================================

df = pd.read_csv(
    file,
    dtype=str,
    low_memory=False
)

# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n========== BASIC INFORMATION ==========")

print(f"Total rows: {len(df):,}")
print(f"Total columns: {len(df.columns)}")

# ============================================================
# COLUMN NAMES
# ============================================================

print("\n========== COLUMN NAMES ==========")

for i, col in enumerate(df.columns, start=1):
    print(f"{i}. {col}")

# ============================================================
# DATA TYPES
# ============================================================

print("\n========== DATA TYPES ==========")

print(df.dtypes)

# ============================================================
# MISSING VALUES
# ============================================================

print("\n========== MISSING VALUES ==========")

missing = pd.DataFrame({
    "Missing Count": df.isna().sum(),
    "Percentage (%)": (
        df.isna().mean() * 100
    ).round(2)
})

print(missing)

# ============================================================
# DUPLICATES
# ============================================================

print("\n========== DUPLICATE ROWS ==========")

print(
    f"Duplicate rows: "
    f"{df.duplicated().sum():,}"
)

# ============================================================
# FIRST 20 ROWS
# ============================================================

print("\n========== FIRST 20 ROWS ==========")

print(
    df.head(20)
    .to_string(index=False)
)

# ============================================================
# UNIQUE COUNTS
# ============================================================

print("\n========== UNIQUE VALUE COUNTS ==========")

for col in df.columns:

    print(
        f"{col}: "
        f"{df[col].nunique(dropna=False):,} unique"
    )

# ============================================================
# POSSIBLE KEY / AMOUNT / CALAMITY COLUMNS
# ============================================================

print("\n========== POSSIBLE KEY / AMOUNT COLUMNS ==========")

keywords = [
    "mp",
    "member",
    "hon",
    "constituency",
    "state",
    "district",
    "ida",
    "id",
    "amount",
    "calamity",
    "year",
    "date",
    "fund",
    "consent"
]

for col in df.columns:

    name = str(col).lower()

    if any(keyword in name for keyword in keywords):

        print(f"\nCOLUMN: {col}")

        print(
            df[col]
            .head(20)
            .to_string(index=False)
        )

print("\n========== INSPECTION COMPLETE ==========")