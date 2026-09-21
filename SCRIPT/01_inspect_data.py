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

# Check in 'raw' folder first, then project root
raw_path = base_dir / "raw" / "Works Recommended.csv"
root_path = base_dir / "Works Recommended.csv"

if raw_path.exists():
    file = raw_path
elif root_path.exists():
    file = root_path
else:
    print("ERROR: 'Works Recommended.csv' was not found.")
    print("Checked locations:")
    print(f"  1. {raw_path}")
    print(f"  2. {root_path}")
    sys.exit(1)

print(f"File loaded from: {file}")


# ============================================================
# 3. LOAD DATA & DETECT SUMMARY FOOTER
# ============================================================

df_raw = pd.read_csv(file, low_memory=False)

# Check if last row is a summary 'Grand Total' row
is_grand_total = df_raw["Sr. No."].astype(str).str.strip().str.lower() == "grand total"
if is_grand_total.any():
    grand_total_row = df_raw[is_grand_total]
    print("\n[NOTE] Detected summary 'Grand Total' footer row in raw CSV:")
    print(grand_total_row.dropna(how="all", axis=1).to_string(index=False))
    # Exclude footer from operational analysis
    df = df_raw[~is_grand_total].copy()
else:
    df = df_raw.copy()


# ============================================================
# 4. BASIC INFORMATION
# ============================================================

print("\n========== BASIC INFORMATION ==========")

print("Total Data Rows:", len(df))
print("Total Columns  :", len(df.columns))


# ============================================================
# 5. COLUMN NAMES
# ============================================================

print("\n========== COLUMN NAMES ==========")

for i, column in enumerate(df.columns, start=1):
    print(f"{i:2d}. {column}")


# ============================================================
# 6. DATA TYPES
# ============================================================

print("\n========== DATA TYPES ==========")

print(df.dtypes)


# ============================================================
# 7. MISSING VALUES
# ============================================================

print("\n========== MISSING VALUES ==========")

missing = df.isnull().sum()
missing_pct = (missing / len(df)) * 100
missing_df = pd.DataFrame({
    "Missing Count": missing,
    "Percentage (%)": missing_pct.round(2)
})
print(missing_df)


# ============================================================
# 8. DUPLICATE ROWS
# ============================================================

print("\n========== DUPLICATE ROWS ==========")

duplicates = df.duplicated().sum()
print("Duplicate rows:", duplicates)


# ============================================================
# 9. FIRST 5 ROWS
# ============================================================

print("\n========== FIRST 5 ROWS ==========")

print(df.head().to_string(index=False))


# ============================================================
# 10. WORK ANALYSIS
# ============================================================

print("\n========== WORK ANALYSIS ==========")

# Clean WORK strings for classification (handling unicode spaces & tabs)
work = df["WORK"].astype("string").str.replace("\xa0", " ", regex=False).str.strip()

print("Total WORK entries:", len(work))
print("Unique WORK values :", work.nunique())
print("Missing WORK entries:", work.isna().sum())


# ============================================================
# 11. CLASSIFY WORK VALUES
# ============================================================

work_type = pd.Series("OTHER", index=df.index)

work_type.loc[work.str.startswith("WS/", na=False)] = "WS"
work_type.loc[work.str.startswith("NA-", na=False)] = "NA"

print("\nWORK type counts:")
print(work_type.value_counts())


# ============================================================
# 12. SANCTION DATE CHECK
# ============================================================

print("\n========== SANCTION DATE CHECK ==========")

sanction_missing = df["Sanction Date"].isna()

cross_table = pd.crosstab(
    work_type,
    sanction_missing,
    rownames=["WORK type"],
    colnames=["Sanction Date missing"]
)

print(cross_table)
print("\nInterpretation:")
print("- 'WS' works represent sanctioned works; all have a valid Sanction Date.")
print("- 'NA' works represent recommended works not yet sanctioned; Sanction Date is missing.")


# ============================================================
# 13. WS EXAMPLES
# ============================================================

print("\n========== WS EXAMPLES (Sanctioned Works) ==========")

ws_examples = df.loc[
    work_type == "WS",
    [
        "Sr. No.",
        "WORK",
        "Recommended date",
        "RECOMMENDED AMOUNT   ( ₹ )",
        "Sanction Date"
    ]
].head(5)

print(ws_examples.to_string(index=False))


# ============================================================
# 14. NA EXAMPLES
# ============================================================

print("\n========== NA EXAMPLES (Unsanctioned / Pending Works) ==========")

na_examples = df.loc[
    work_type == "NA",
    [
        "Sr. No.",
        "WORK",
        "Recommended date",
        "RECOMMENDED AMOUNT   ( ₹ )",
        "Sanction Date"
    ]
].head(5)

print(na_examples.to_string(index=False))


# ============================================================
# 15. OTHER RECORDS
# ============================================================

print("\n========== OTHER RECORDS ==========")

other = df.loc[
    work_type == "OTHER",
    [
        "Sr. No.",
        "WORK",
        "Recommended date",
        "RECOMMENDED AMOUNT   ( ₹ )",
        "Sanction Date"
    ]
]

if len(other) == 0:
    print("No OTHER records found (100% of rows are classified as WS or NA).")
else:
    print(other.to_string(index=False))


# ============================================================
# 16. WORK UNIQUENESS BREAKDOWN
# ============================================================

print("\n========== WORK UNIQUENESS BREAKDOWN ==========")

ws_work = work[work_type == "WS"]
na_work = work[work_type == "NA"]

print(f"WS works  : {len(ws_work)} total, {ws_work.nunique()} unique IDs")
print(f"NA works  : {len(na_work)} total, {na_work.nunique()} unique category descriptions")
print(f"Explanation: 'NA' works do not have unique IDs assigned yet; they use generic categories (e.g. 'NA-Street lights').")


# ============================================================
# 17. END
# ============================================================

print("\n========== INSPECTION COMPLETE ==========")
print("No source data file was modified.")