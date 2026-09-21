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

print("Script directory:")
print(Path(__file__).resolve())

print("\nProject directory:")
print(base_dir)

# ============================================================
# FIND FILE
# ============================================================

possible_files = [
    base_dir / "Allocated Limit for Honble MPs.csv",
    base_dir / "Allocated Limit for Honble MPs.CSV",
    base_dir / "Allocated Limit for Hon'ble MPs.csv",
    base_dir / "Allocated Limit for Hon'ble MPs.CSV",
    base_dir / "raw" / "Allocated Limit for Honble MPs.csv",
    base_dir / "raw" / "Allocated Limit for Honble MPs.CSV",
    base_dir / "raw" / "Allocated Limit for Hon'ble MPs.csv",
    base_dir / "raw" / "Allocated Limit for Hon'ble MPs.CSV",
]

file = None

for candidate in possible_files:

    print(f"\nChecking:")
    print(candidate)

    if candidate.exists():
        file = candidate
        break

# ============================================================
# IF NOT FOUND
# ============================================================

if file is None:

    print("\nERROR: Allocated Limit CSV not found.")

    print("\nCSV files currently in project directory:")

    for f in base_dir.glob("*.csv"):
        print(f" - {f.name}")

    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("\n========== FILE FOUND ==========")
print(file)

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
# FIRST 15 ROWS
# ============================================================

print("\n========== FIRST 15 ROWS ==========")

print(
    df.head(15)
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
# POSSIBLE KEY / AMOUNT COLUMNS
# ============================================================

print("\n========== POSSIBLE KEY / AMOUNT COLUMNS ==========")

keywords = [
    "mp",
    "member",
    "hon",
    "constituency",
    "state",
    "ida",
    "id",
    "amount",
    "limit",
    "year",
    "financial"
]

for col in df.columns:

    name = str(col).lower()

    if any(keyword in name for keyword in keywords):

        print(f"\nCOLUMN: {col}")

        print(
            df[col]
            .head(15)
            .to_string(index=False)
        )

print("\n========== INSPECTION COMPLETE ==========")