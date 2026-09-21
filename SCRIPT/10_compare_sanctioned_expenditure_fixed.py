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
# SANCTIONED KEY
# ============================================================

sanctioned["work_id"] = (
    sanctioned["work_id"]
    .astype("string")
    .str.strip()
)

# ============================================================
# EXPENDITURE KEY
# ============================================================

expenditure["work_id"] = (
    expenditure["work_id"]
    .astype("string")
    .str.strip()
)

# Extract the numeric Work ID from Expenditure
expenditure["work_id_numeric"] = (
    expenditure["work_id"]
    .str.extract(r"/(\d+)$", expand=False)
)

# ============================================================
# BASIC CHECK
# ============================================================

print("\n========== KEY FORMAT CHECK ==========")

print("Sanctioned sample:")

print(
    sanctioned["work_id"]
    .head(10)
    .to_string(index=False)
)

print("\nExpenditure full Work ID sample:")

print(
    expenditure["work_id"]
    .head(10)
    .to_string(index=False)
)

print("\nExpenditure extracted numeric ID sample:")

print(
    expenditure["work_id_numeric"]
    .head(10)
    .to_string(index=False)
)

# ============================================================
# COMPARE
# ============================================================

sanctioned_ids = set(
    sanctioned["work_id"]
    .dropna()
    .astype(str)
)

expenditure_numeric_ids = set(
    expenditure["work_id_numeric"]
    .dropna()
    .astype(str)
)

common_ids = (
    sanctioned_ids &
    expenditure_numeric_ids
)

only_sanctioned = (
    sanctioned_ids -
    expenditure_numeric_ids
)

only_expenditure = (
    expenditure_numeric_ids -
    sanctioned_ids
)

# ============================================================
# RESULTS
# ============================================================

print("\n========== FIXED DATASET COMPARISON ==========")

print(
    f"Sanctioned Work IDs       : "
    f"{len(sanctioned_ids):,}"
)

print(
    f"Expenditure Work IDs      : "
    f"{len(expenditure_numeric_ids):,}"
)

print(
    f"Common Work IDs           : "
    f"{len(common_ids):,}"
)

print(
    f"Only in Sanctioned        : "
    f"{len(only_sanctioned):,}"
)

print(
    f"Only in Expenditure       : "
    f"{len(only_expenditure):,}"
)

if len(expenditure_numeric_ids) > 0:

    percentage = (
        len(common_ids) /
        len(expenditure_numeric_ids)
    ) * 100

    print(
        f"\nExpenditure → Sanctioned ID match: "
        f"{percentage:.2f}%"
    )

# ============================================================
# TRANSACTION MATCH
# ============================================================

expenditure["matches_sanctioned"] = (
    expenditure["work_id_numeric"]
    .isin(sanctioned_ids)
)

matched = expenditure[
    expenditure["matches_sanctioned"]
]

unmatched = expenditure[
    ~expenditure["matches_sanctioned"]
]

print("\n========== TRANSACTION COVERAGE ==========")

print(
    f"Total expenditure transactions : "
    f"{len(expenditure):,}"
)

print(
    f"Matched transactions           : "
    f"{len(matched):,}"
)

print(
    f"Unmatched transactions         : "
    f"{len(unmatched):,}"
)

if len(expenditure) > 0:

    transaction_percentage = (
        len(matched) /
        len(expenditure)
    ) * 100

    print(
        f"Transaction match: "
        f"{transaction_percentage:.2f}%"
    )

# ============================================================
# AMOUNT COVERAGE
# ============================================================

expenditure["fund_disbursed_amount"] = pd.to_numeric(
    expenditure["fund_disbursed_amount"],
    errors="coerce"
)

matched_amount = matched[
    "fund_disbursed_amount"
].astype(float).sum()

unmatched_amount = unmatched[
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
# UNMATCHED SAMPLE
# ============================================================

print("\n========== UNMATCHED EXPENDITURE SAMPLE ==========")

if len(unmatched) > 0:

    print(
        unmatched[
            [
                "work_id",
                "work_id_numeric",
                "state",
                "mp_name",
                "constituency",
                "expenditure_date",
                "fund_disbursed_amount"
            ]
        ]
        .head(20)
        .to_string(index=False)
    )

else:

    print("No unmatched expenditure transactions.")

# ============================================================
# SAVE
# ============================================================

output_file = (
    analysis_dir /
    "sanctioned_vs_expenditure_fixed.csv"
)

expenditure.to_csv(
    output_file,
    index=False
)

print("\nSaved comparison data to:")
print(output_file)

print("\n========== COMPLETE ==========")