import sys
from pathlib import Path
import pandas as pd


# ============================================================
# 1. UTF-8 OUTPUT
# ============================================================

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


# ============================================================
# 2. FIND FILE
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

file = (
    base_dir
    / "raw"
    / "Expenditure on Completed and On-going Works as on Date.csv"
)

if not file.exists():
    file = (
        base_dir
        / "Expenditure on Completed and On-going Works as on Date.csv"
    )

if not file.exists():
    print("ERROR: Expenditure CSV not found.")
    sys.exit(1)


print("File loaded from:")
print(file)


# ============================================================
# 3. LOAD
# ============================================================

df = pd.read_csv(
    file,
    dtype=str,
    low_memory=False
)


# ============================================================
# 4. BASIC INFORMATION
# ============================================================

print("\n========== BASIC INFORMATION ==========")

print("Total rows:", len(df))
print("Total columns:", len(df.columns))


# ============================================================
# 5. COLUMN NAMES
# ============================================================

print("\n========== COLUMN NAMES ==========")

for i, column in enumerate(df.columns, start=1):
    print(f"{i}. {column}")


# ============================================================
# 6. DATA TYPES
# ============================================================

print("\n========== DATA TYPES ==========")

print(df.dtypes)


# ============================================================
# 7. MISSING VALUES
# ============================================================

print("\n========== MISSING VALUES ==========")

missing = df.isna().sum()

percentage = (
    missing / len(df) * 100
).round(2)

missing_table = pd.DataFrame({
    "Missing Count": missing,
    "Percentage (%)": percentage
})

print(missing_table)


# ============================================================
# 8. DUPLICATES
# ============================================================

print("\n========== DUPLICATE ROWS ==========")

print(
    "Duplicate rows:",
    df.duplicated().sum()
)


# ============================================================
# 9. FIRST 10 ROWS
# ============================================================

print("\n========== FIRST 10 ROWS ==========")

print(
    df.head(10)
    .to_string(index=False)
)


# ============================================================
# 10. POSSIBLE ID / WORK COLUMNS
# ============================================================

print("\n========== POSSIBLE ID / WORK COLUMNS ==========")

for column in df.columns:

    if any(
        keyword in column.lower()
        for keyword in [
            "work",
            "id",
            "sanction",
            "expenditure",
            "amount",
            "payment"
        ]
    ):

        print(f"\nCOLUMN: {column}")

        print(
            df[column]
            .head(10)
            .to_string(index=False)
        )


# ============================================================
# 11. UNIQUE VALUE COUNTS
# ============================================================

print("\n========== UNIQUE VALUE COUNTS ==========")

for column in df.columns:

    print(
        f"{column}: "
        f"{df[column].nunique(dropna=True)} unique"
    )


# ============================================================
# 12. END
# ============================================================

print("\n========== INSPECTION COMPLETE ==========")
