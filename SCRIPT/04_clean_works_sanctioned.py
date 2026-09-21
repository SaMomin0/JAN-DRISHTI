import sys
from pathlib import Path
import pandas as pd


# ============================================================
# 1. UTF-8 OUTPUT
# ============================================================

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


# ============================================================
# 2. PATHS
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

input_file = base_dir / "raw" / "Works Sanctioned.csv"

if not input_file.exists():
    input_file = base_dir / "Works Sanctioned.csv"

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "Works Sanctioned_cleaned.csv"


# ============================================================
# 3. LOAD
# ============================================================

print("Loading:")
print(input_file)

df = pd.read_csv(
    input_file,
    dtype=str,
    low_memory=False
)

print("\nRaw rows:", len(df))


# ============================================================
# 4. REMOVE GRAND TOTAL FOOTER IF PRESENT
# ============================================================

grand_total_mask = (
    df["Sr. No."]
    .astype("string")
    .str.strip()
    .str.lower()
    .eq("grand total")
)

grand_total_count = grand_total_mask.sum()

print("Grand Total rows found:", grand_total_count)

if grand_total_count > 0:
    print("\nGrand Total row:")
    print(
        df.loc[grand_total_mask]
        .to_string(index=False)
    )

    df = df.loc[~grand_total_mask].copy()

print("Rows after footer removal:", len(df))


# ============================================================
# 5. RENAME COLUMNS
# ============================================================

df = df.rename(columns={
    "Sr. No.": "sr_no",
    "Work category": "work_category",
    "Work": "work",
    "State": "state",
    "IDA": "ida",
    "Hon'ble Members of Parliament": "mp_name",
    "Constituency": "constituency",
    "Work description": "work_description",
    "Recommended date": "recommended_date",
    "Sanction Date": "sanction_date",
    "Sanction Amount ( ₹ )": "sanction_amount",
    "Work Status": "work_status"
})


# ============================================================
# 6. CLEAN TEXT
# ============================================================

text_columns = [
    "work_category",
    "work",
    "state",
    "ida",
    "mp_name",
    "constituency",
    "work_description",
    "work_status"
]

for column in text_columns:
    df[column] = (
        df[column]
        .astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )


# ============================================================
# 7. CLEAN WORK FIELD
# ============================================================

# Remove tab/extra whitespace after WS/
df["work"] = (
    df["work"]
    .str.replace(r"^WS/\s*", "WS/", regex=True)
    .str.strip()
)


# ============================================================
# 8. SR NO
# ============================================================

df["sr_no"] = pd.to_numeric(
    df["sr_no"],
    errors="coerce"
).astype("Int64")


# ============================================================
# 9. MONEY
# ============================================================

df["sanction_amount"] = (
    df["sanction_amount"]
    .astype("string")
    .str.strip()
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.replace(" ", "", regex=False)
)

df["sanction_amount"] = pd.to_numeric(
    df["sanction_amount"],
    errors="coerce"
)


# ============================================================
# 10. DATES
# ============================================================

df["recommended_date"] = pd.to_datetime(
    df["recommended_date"],
    format="%d-%b-%Y",
    errors="coerce"
)

df["sanction_date"] = pd.to_datetime(
    df["sanction_date"],
    format="%d-%b-%Y",
    errors="coerce"
)


# ============================================================
# 11. EXTRACT WORK ID
# ============================================================

df["work_id"] = (
    df["work"]
    .str.extract(
        r"^WS/[^/]+/\d{4}-\d{4}/(\d+)-",
        expand=False
    )
)


# ============================================================
# 12. VALIDATION
# ============================================================

print("\n========== CLEANING VALIDATION ==========")

print("\nTotal rows:", len(df))

print("\nMissing values:")
print(df.isna().sum())


# ============================================================
# 13. WORK ID VALIDATION
# ============================================================

print("\n========== WORK ID VALIDATION ==========")

print("Total rows:", len(df))

print(
    "Work IDs found:",
    df["work_id"].notna().sum()
)

print(
    "Work IDs missing:",
    df["work_id"].isna().sum()
)

print(
    "Unique Work IDs:",
    df["work_id"].nunique()
)

print(
    "Duplicate Work IDs:",
    df["work_id"].duplicated().sum()
)


# ============================================================
# 14. WORK STATUS
# ============================================================

print("\n========== WORK STATUS ==========")

print(
    df["work_status"]
    .value_counts(dropna=False)
)


# ============================================================
# 15. MONEY VALIDATION
# ============================================================

print("\n========== SANCTION AMOUNT ==========")

print(
    "Missing:",
    df["sanction_amount"].isna().sum()
)

print(
    "Minimum:",
    df["sanction_amount"].min()
)

print(
    "Maximum:",
    df["sanction_amount"].max()
)


# ============================================================
# 16. DATE VALIDATION
# ============================================================

print("\n========== DATE VALIDATION ==========")

print(
    "Recommended dates missing:",
    df["recommended_date"].isna().sum()
)

print(
    "Sanction dates missing:",
    df["sanction_date"].isna().sum()
)


# ============================================================
# 17. SAMPLE
# ============================================================

print("\n========== CLEANED SAMPLE ==========")

sample_columns = [
    "sr_no",
    "work_id",
    "work",
    "mp_name",
    "constituency",
    "recommended_date",
    "sanction_date",
    "sanction_amount",
    "work_status"
]

print(
    df[sample_columns]
    .head(10)
    .to_string(index=False)
)


# ============================================================
# 18. SAVE
# ============================================================

df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\n========== COMPLETE ==========")

print("Cleaned file saved to:")
print(output_file)

print("\nOriginal raw file was NOT modified.")