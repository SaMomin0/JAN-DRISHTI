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

file = base_dir / "Works Completed.csv"

if not file.exists():
    file = base_dir / "raw" / "Works Completed.csv"

if not file.exists():
    print("ERROR: Works Completed.csv not found.")
    sys.exit(1)

print("File loaded from:")
print(file)

# ============================================================
# LOAD DATA
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
# FIRST 10 ROWS
# ============================================================

print("\n========== FIRST 10 ROWS ==========")

print(
    df.head(10).to_string(index=False)
)

# ============================================================
# POSSIBLE ID / WORK COLUMNS
# ============================================================

print("\n========== POSSIBLE ID / WORK COLUMNS ==========")

possible_columns = []

for col in df.columns:

    name = str(col).lower()

    keywords = [
        "work",
        "id",
        "sanction",
        "complete",
        "date",
        "amount",
        "expenditure",
        "payment",
        "status"
    ]

    if any(keyword in name for keyword in keywords):
        possible_columns.append(col)

for col in possible_columns:

    print(f"\nCOLUMN: {col}")

    print(
        df[col]
        .head(10)
        .to_string(index=False)
    )

# ============================================================
# UNIQUE COUNTS
# ============================================================

print("\n========== UNIQUE VALUE COUNTS ==========")

for col in df.columns:

    if any(
        keyword in str(col).lower()
        for keyword in [
            "work",
            "id",
            "state",
            "ida",
            "member",
            "mp",
            "constituency",
            "status",
            "date",
            "amount"
        ]
    ):

        print(
            f"{col}: "
            f"{df[col].nunique(dropna=False):,} unique"
        )

# ============================================================
# WORK ID CANDIDATE ANALYSIS
# ============================================================

print("\n========== WORK ID CANDIDATE ANALYSIS ==========")

for col in df.columns:

    name = str(col).lower()

    if "work" in name and "id" in name:

        print(f"\nAnalyzing: {col}")

        values = (
            df[col]
            .astype(str)
            .str.strip()
        )

        print(
            f"Unique values: "
            f"{values.nunique():,}"
        )

        print(
            f"Missing values: "
            f"{df[col].isna().sum():,}"
        )

        print("Sample values:")

        print(
            values.head(20)
            .to_string(index=False)
        )

# ============================================================
# COMPLETE
# ============================================================

print("\n========== INSPECTION COMPLETE ==========")
