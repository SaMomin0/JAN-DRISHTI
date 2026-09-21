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

completed_file = (
    base_dir / "cleaned" / "Works Completed_cleaned.csv"
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

print("Loading Completed...")
completed = pd.read_csv(
    completed_file,
    dtype=str,
    low_memory=False
)

# ============================================================
# CLEAN KEYS
# ============================================================

sanctioned["work_id"] = (
    sanctioned["work_id"]
    .astype("string")
    .str.strip()
)

completed["work_id"] = (
    completed["work_id"]
    .astype("string")
    .str.strip()
)

# ============================================================
# ID SETS
# ============================================================

sanctioned_ids = set(
    sanctioned["work_id"]
    .dropna()
    .unique()
)

completed_ids = set(
    completed["work_id"]
    .dropna()
    .unique()
)

common_ids = sanctioned_ids & completed_ids

only_sanctioned = sanctioned_ids - completed_ids
only_completed = completed_ids - sanctioned_ids

# ============================================================
# BASIC COMPARISON
# ============================================================

print("\n========== DATASET COMPARISON ==========")

print(
    f"Sanctioned Work IDs : "
    f"{len(sanctioned_ids):,}"
)

print(
    f"Completed Work IDs  : "
    f"{len(completed_ids):,}"
)

print(
    f"Common Work IDs     : "
    f"{len(common_ids):,}"
)

print(
    f"Only in Sanctioned  : "
    f"{len(only_sanctioned):,}"
)

print(
    f"Only in Completed   : "
    f"{len(only_completed):,}"
)

if len(completed_ids) > 0:

    match_percentage = (
        len(common_ids) /
        len(completed_ids)
    ) * 100

    print(
        f"\nCompleted → Sanctioned ID match: "
        f"{match_percentage:.2f}%"
    )

# ============================================================
# ONLY COMPLETED
# ============================================================

print("\n========== ONLY IN COMPLETED ==========")

if only_completed:

    only_completed_df = completed[
        completed["work_id"].isin(only_completed)
    ].copy()

    cols = [
        "work_id",
        "state",
        "mp_name",
        "constituency",
        "completion_date",
        "amount_disbursed"
    ]

    print(
        only_completed_df[cols]
        .head(20)
        .to_string(index=False)
    )

else:

    print("No Completed-only Work IDs.")

# ============================================================
# ONLY SANCTIONED
# ============================================================

print("\n========== ONLY IN SANCTIONED ==========")

if only_sanctioned:

    only_sanctioned_df = sanctioned[
        sanctioned["work_id"].isin(only_sanctioned)
    ].copy()

    cols = [
        "work_id",
        "mp_name",
        "constituency",
        "recommended_date",
        "sanction_date",
        "sanction_amount",
        "work_status"
    ]

    print(
        only_sanctioned_df[cols]
        .head(20)
        .to_string(index=False)
    )

else:

    print("No Sanctioned-only Work IDs.")

# ============================================================
# COMPLETION COVERAGE
# ============================================================

print("\n========== SANCTIONED COMPLETION COVERAGE ==========")

sanctioned["is_completed"] = (
    sanctioned["work_id"].isin(completed_ids)
)

completed_count = sanctioned["is_completed"].sum()
not_completed_count = (~sanctioned["is_completed"]).sum()

print(
    f"Sanctioned works with completion record : "
    f"{completed_count:,}"
)

print(
    f"Sanctioned works without completion record : "
    f"{not_completed_count:,}"
)

if len(sanctioned) > 0:

    percentage = (
        completed_count /
        len(sanctioned)
    ) * 100

    print(
        f"Completion record coverage: "
        f"{percentage:.2f}%"
    )

# ============================================================
# SAVE MATCHED COMPLETED DATA
# ============================================================

matched_completed = completed[
    completed["work_id"].isin(sanctioned_ids)
].copy()

matched_file = (
    analysis_dir /
    "sanctioned_completed_matched.csv"
)

matched_completed.to_csv(
    matched_file,
    index=False
)

print("\nMatched Completed records saved to:")
print(matched_file)

# ============================================================
# SAVE ONLY COMPLETED
# ============================================================

if only_completed:

    only_completed_df = completed[
        completed["work_id"].isin(only_completed)
    ].copy()

    output_file = (
        analysis_dir /
        "only_in_completed.csv"
    )

    only_completed_df.to_csv(
        output_file,
        index=False
    )

    print("\nOnly Completed saved to:")
    print(output_file)

# ============================================================
# COMPLETE
# ============================================================

print("\n========== COMPLETE ==========")