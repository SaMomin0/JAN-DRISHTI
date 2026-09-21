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

input_file = base_dir / "Works Recommended.csv"
raw_file = base_dir / "raw" / "Works Recommended.csv"

# Prefer raw folder
if raw_file.exists():
    input_file = raw_file

output_dir = base_dir / "cleaned"
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "Works Recommended_cleaned.csv"


# ============================================================
# 3. LOAD RAW DATA
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
# 4. REMOVE GRAND TOTAL FOOTER
# ============================================================

# Detect rows where Sr. No. contains "Grand Total"
grand_total_mask = (
    df["Sr. No."]
    .astype("string")
    .str.strip()
    .str.lower()
    .eq("grand total")
)

grand_total_count = grand_total_mask.sum()

print("\nGrand Total rows found:", grand_total_count)

if grand_total_count > 0:
    print("\nGrand Total row:")
    print(df.loc[grand_total_mask].to_string(index=False))

    df = df.loc[~grand_total_mask].copy()

print("\nRows after footer removal:", len(df))


# ============================================================
# 5. CLEAN COLUMN NAMES
# ============================================================

print("\nOriginal column names:")
print(df.columns.tolist())

df = df.rename(columns={
    "Sr. No.": "sr_no",
    "Work category": "work_category",
    "WORK": "work",
    "State": "state",
    "IDA": "ida",
    "Hon'ble Members of Parliament": "mp_name",
    "Constituency": "constituency",
    "Work description": "work_description",
    "Recommended date": "recommended_date",
    "RECOMMENDED AMOUNT   ( ₹ )": "recommended_amount",
    "Sanction Date": "sanction_date"
})

print("\nClean column names:")
print(df.columns.tolist())


# ============================================================
# 6. CLEAN TEXT COLUMNS
# ============================================================

text_columns = [
    "work_category",
    "work",
    "state",
    "ida",
    "mp_name",
    "constituency",
    "work_description"
]

for column in text_columns:
    df[column] = (
        df[column]
        .astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )


# ============================================================
# 7. CLEAN SR NO
# ============================================================

df["sr_no"] = pd.to_numeric(
    df["sr_no"],
    errors="coerce"
).astype("Int64")


# ============================================================
# 8. CLEAN RECOMMENDED AMOUNT
# ============================================================

df["recommended_amount"] = (
    df["recommended_amount"]
    .astype("string")
    .str.strip()
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.replace(" ", "", regex=False)
)

df["recommended_amount"] = pd.to_numeric(
    df["recommended_amount"],
    errors="coerce"
)


# ============================================================
# 9. CLEAN RECOMMENDED DATE
# ============================================================

df["recommended_date"] = pd.to_datetime(
    df["recommended_date"],
    format="%d-%b-%Y",
    errors="coerce"
)


# ============================================================
# 10. CLEAN SANCTION DATE
# ============================================================

df["sanction_date"] = (
    df["sanction_date"]
    .astype("string")
    .str.strip()
)

# Convert empty strings to missing
df.loc[
    df["sanction_date"].isin(["", "nan", "None"]),
    "sanction_date"
] = pd.NA

df["sanction_date"] = pd.to_datetime(
    df["sanction_date"],
    format="%d-%b-%Y",
    errors="coerce"
)


# ============================================================
# 11. CLEAN WORK PREFIX
# ============================================================

# Remove the strange tab/whitespace after WS/
df["work"] = (
    df["work"]
    .str.replace(r"^WS/\s*", "WS/", regex=True)
    .str.strip()
)


# ============================================================
# 12. CLASSIFY WORK STATUS
# ============================================================

df["work_status"] = "OTHER"

df.loc[
    df["work"].str.startswith("WS/", na=False),
    "work_status"
] = "SANCTIONED"

df.loc[
    df["work"].str.startswith("NA-", na=False),
    "work_status"
] = "RECOMMENDED"


# ============================================================
# 13. CREATE WORK ID
# ============================================================

# IMPORTANT:
# Only WS records currently have a structured ID.
#
# Example:
# WS/MP620/2024-2025/133166-Construction...
#
# We extract:
# 133166
#
# NA records will remain missing.

df["work_id"] = pd.NA

ws_mask = df["work_status"].eq("SANCTIONED")

df.loc[ws_mask, "work_id"] = (
    df.loc[ws_mask, "work"]
    .str.extract(
        r"^WS/[^/]+/\d{4}-\d{4}/(\d+)-",
        expand=False
    )
)


# ============================================================
# 14. VALIDATION
# ============================================================

print("\n========== CLEANING VALIDATION ==========")

print("\nTotal rows:", len(df))

print("\nWork status:")
print(df["work_status"].value_counts(dropna=False))

print("\nMissing values:")
print(df.isna().sum())


# ============================================================
# 15. WORK ID VALIDATION
# ============================================================

print("\n========== WORK ID VALIDATION ==========")

print(
    "WS rows:",
    ws_mask.sum()
)

print(
    "WS rows with Work ID:",
    df.loc[ws_mask, "work_id"].notna().sum()
)

print(
    "WS rows without Work ID:",
    df.loc[ws_mask, "work_id"].isna().sum()
)

print(
    "Unique WS Work IDs:",
    df.loc[ws_mask, "work_id"].nunique()
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
# 17. AMOUNT VALIDATION
# ============================================================

print("\n========== AMOUNT VALIDATION ==========")

print(
    "Recommended amounts missing:",
    df["recommended_amount"].isna().sum()
)

print(
    "Recommended amount minimum:",
    df["recommended_amount"].min()
)

print(
    "Recommended amount maximum:",
    df["recommended_amount"].max()
)


# ============================================================
# 18. SHOW SAMPLE CLEANED DATA
# ============================================================

print("\n========== CLEANED SAMPLE ==========")

columns_to_show = [
    "sr_no",
    "work_status",
    "work_id",
    "work",
    "mp_name",
    "constituency",
    "recommended_date",
    "recommended_amount",
    "sanction_date"
]

print(
    df[columns_to_show]
    .head(10)
    .to_string(index=False)
)


# ============================================================
# 19. SAVE CLEANED DATA
# ============================================================

df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\n========== COMPLETE ==========")

print("Cleaned file saved to:")
print(output_file)

print("\nOriginal RAW file was NOT modified.")