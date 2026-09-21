import sys
from pathlib import Path
import pandas as pd

# UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ============================================================
# PATHS
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

expenditure_file = (
    base_dir / "Expenditure on Completed and On-going Works as on Date.csv"
)

if not expenditure_file.exists():
    expenditure_file = (
        base_dir / "raw" /
        "Expenditure on Completed and On-going Works as on Date.csv"
    )

if not expenditure_file.exists():
    print("ERROR: Expenditure CSV not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Expenditure...")
df = pd.read_csv(
    expenditure_file,
    dtype=str,
    low_memory=False
)

print(f"Rows loaded: {len(df):,}")

# ============================================================
# CLEAN ONLY FOR ANALYSIS
# ============================================================

df["Work ID"] = df["Work ID"].astype(str).str.strip()

# ============================================================
# WORK ID FREQUENCY
# ============================================================

id_counts = df["Work ID"].value_counts()

print("\n========== WORK ID ANALYSIS ==========")

print(f"Total expenditure rows : {len(df):,}")
print(f"Unique Work IDs        : {df['Work ID'].nunique():,}")

print(
    f"Work IDs appearing once : "
    f"{(id_counts == 1).sum():,}"
)

print(
    f"Work IDs appearing >1   : "
    f"{(id_counts > 1).sum():,}"
)

print(
    f"Maximum transactions for one Work ID : "
    f"{id_counts.max():,}"
)

# ============================================================
# TRANSACTION DISTRIBUTION
# ============================================================

print("\n========== TRANSACTION DISTRIBUTION ==========")

print(
    id_counts.value_counts()
    .sort_index()
    .head(20)
)

# ============================================================
# TOP WORK IDS BY TRANSACTION COUNT
# ============================================================

print("\n========== TOP 20 WORK IDs ==========")

top_ids = id_counts.head(20)

for work_id, count in top_ids.items():
    print(f"{work_id} -> {count} transactions")

# ============================================================
# CHECK WORK ID FORMAT
# ============================================================

print("\n========== WORK ID FORMAT ==========")

valid_pattern = df["Work ID"].str.match(
    r"^WS/[^/]+/\d{4}-\d{4}/\d+-",
    na=False
)

print(f"Valid WS Work IDs : {valid_pattern.sum():,}")
print(f"Invalid Work IDs  : {(~valid_pattern).sum():,}")

if (~valid_pattern).sum() > 0:
    print("\nSample invalid Work IDs:")
    print(
        df.loc[~valid_pattern, "Work ID"]
        .head(20)
        .to_string(index=False)
    )

# ============================================================
# PAYMENT STATUS
# ============================================================

print("\n========== PAYMENT STATUS ==========")

print(
    df["Payment Status"]
    .value_counts(dropna=False)
)

# ============================================================
# EXPENDITURE DATE
# ============================================================

print("\n========== EXPENDITURE DATE ==========")

dates = pd.to_datetime(
    df["Expenditure Date"],
    format="%d-%b-%Y",
    errors="coerce"
)

print(f"Valid dates : {dates.notna().sum():,}")
print(f"Invalid dates : {dates.isna().sum():,}")

if dates.notna().any():
    print(f"Minimum date : {dates.min()}")
    print(f"Maximum date : {dates.max()}")

# ============================================================
# AMOUNT
# ============================================================

print("\n========== FUND DISBURSED AMOUNT ==========")

amount = (
    df["Fund Disbursed Amount ( ₹ )"]
    .astype(str)
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .str.strip()
)

amount = pd.to_numeric(amount, errors="coerce")

print(f"Valid amounts   : {amount.notna().sum():,}")
print(f"Invalid amounts : {amount.isna().sum():,}")

if amount.notna().any():
    print(f"Minimum amount : ₹{amount.min():,.2f}")
    print(f"Maximum amount : ₹{amount.max():,.2f}")
    print(f"Total disbursed in dataset : ₹{amount.sum():,.2f}")

# ============================================================
# SAMPLE MULTIPLE TRANSACTIONS
# ============================================================

print("\n========== SAMPLE WORKS WITH MULTIPLE TRANSACTIONS ==========")

multi_ids = id_counts[id_counts > 1].head(5).index

for work_id in multi_ids:

    print("\n----------------------------------------")
    print(f"WORK ID: {work_id}")
    print("----------------------------------------")

    cols = [
        "Work ID",
        "Expenditure Date",
        "Vendor Name",
        "Payment Status",
        "Fund Disbursed Amount ( ₹ )"
    ]

    print(
        df[df["Work ID"] == work_id][cols]
        .to_string(index=False)
    )

print("\n========== COMPLETE ==========")