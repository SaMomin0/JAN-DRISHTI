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

sanctioned_file = (
    base_dir / "cleaned" / "Works Sanctioned_cleaned.csv"
)

expenditure_file = (
    base_dir / "cleaned" / "Expenditure_cleaned.csv"
)

analysis_dir = base_dir / "analysis"
analysis_dir.mkdir(exist_ok=True)

if not sanctioned_file.exists():
    print("ERROR: Works Sanctioned cleaned file not found.")
    sys.exit(1)

if not expenditure_file.exists():
    print("ERROR: Expenditure cleaned file not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Sanctioned...")
sanctioned = pd.read_csv(
    sanctioned_file,
    dtype=str,
    low_memory=False
)

print("Loading Expenditure...")
expenditure = pd.read_csv(
    expenditure_file,
    dtype=str,
    low_memory=False
)

# ============================================================
# CLEAN WORK IDs FOR COMPARISON
# ============================================================

sanctioned["work_id"] = (
    sanctioned["work_id"]
    .astype("string")
    .str.strip()
    .str.replace(r"\s+", "", regex=True)
)

expenditure["work_id"] = (
    expenditure["work_id"]
    .astype("string")
    .str.strip()
    .str.replace(r"\s+", "", regex=True)
)

# ============================================================
# UNIQUE ID SETS
# ============================================================

sanctioned_ids = set(
    sanctioned["work_id"].dropna().unique()
)

expenditure_ids = set(
    expenditure["work_id"].dropna().unique()
)

common_ids = sanctioned_ids & expenditure_ids

only_sanctioned = sanctioned_ids - expenditure_ids
only_expenditure = expenditure_ids - sanctioned_ids

# ============================================================
# BASIC COMPARISON
# ============================================================

print("\n========== DATASET COMPARISON ==========")

print(
    f"Sanctioned Work IDs    : "
    f"{len(sanctioned_ids):,}"
)

print(
    f"Expenditure Work IDs   : "
    f"{len(expenditure_ids):,}"
)

print(
    f"Common Work IDs        : "
    f"{len(common_ids):,}"
)

print(
    f"Only in Sanctioned     : "
    f"{len(only_sanctioned):,}"
)

print(
    f"Only in Expenditure    : "
    f"{len(only_expenditure):,}"
)

if len(expenditure_ids) > 0:
    match_percentage = (
        len(common_ids) / len(expenditure_ids)
    ) * 100

    print(
        f"\nExpenditure → Sanctioned ID match: "
        f"{match_percentage:.2f}%"
    )

# ============================================================
# TRANSACTION COVERAGE
# ============================================================

expenditure["matches_sanctioned"] = (
    expenditure["work_id"].isin(sanctioned_ids)
)

matched_transactions = expenditure[
    expenditure["matches_sanctioned"]
]

unmatched_transactions = expenditure[
    ~expenditure["matches_sanctioned"]
]

print("\n========== TRANSACTION COVERAGE ==========")

print(
    f"Total expenditure transactions : "
    f"{len(expenditure):,}"
)

print(
    f"Matched transactions           : "
    f"{len(matched_transactions):,}"
)

print(
    f"Unmatched transactions         : "
    f"{len(unmatched_transactions):,}"
)

if len(expenditure) > 0:

    transaction_match_percentage = (
        len(matched_transactions) /
        len(expenditure)
    ) * 100

    print(
        f"Transaction match: "
        f"{transaction_match_percentage:.2f}%"
    )

# ============================================================
# ONLY IN EXPENDITURE
# ============================================================

print("\n========== ONLY IN EXPENDITURE ==========")

if only_expenditure:

    only_exp_df = expenditure[
        expenditure["work_id"].isin(only_expenditure)
    ].copy()

    display_cols = [
        "work_id",
        "state",
        "mp_name",
        "constituency",
        "expenditure_date",
        "vendor_name",
        "payment_status",
        "fund_disbursed_amount"
    ]

    print(
        only_exp_df[display_cols]
        .head(20)
        .to_string(index=False)
    )

else:

    print("No expenditure-only Work IDs.")

# ============================================================
# EXPENDITURE AMOUNT COVERAGE
# ============================================================

expenditure["fund_disbursed_amount"] = pd.to_numeric(
    expenditure["fund_disbursed_amount"],
    errors="coerce"
)

matched_amount = matched_transactions[
    "fund_disbursed_amount"
].astype(float).sum()

unmatched_amount = unmatched_transactions[
    "fund_disbursed_amount"
].astype(float).sum()

total_amount = expenditure[
    "fund_disbursed_amount"
].astype(float).sum()

print("\n========== AMOUNT COVERAGE ==========")

print(
    f"Total expenditure amount : "
    f"₹{total_amount:,.2f}"
)

print(
    f"Matched amount           : "
    f"₹{matched_amount:,.2f}"
)

print(
    f"Unmatched amount         : "
    f"₹{unmatched_amount:,.2f}"
)

if total_amount > 0:

    print(
        f"Amount match: "
        f"{matched_amount / total_amount * 100:.2f}%"
    )

# ============================================================
# SAVE UNMATCHED
# ============================================================

if len(only_expenditure) > 0:

    only_exp_df = expenditure[
        expenditure["work_id"].isin(only_expenditure)
    ].copy()

    output_file = (
        analysis_dir /
        "only_in_expenditure.csv"
    )

    only_exp_df.to_csv(
        output_file,
        index=False
    )

    print("\nOnly Expenditure saved to:")
    print(output_file)

print("\n========== COMPLETE ==========")