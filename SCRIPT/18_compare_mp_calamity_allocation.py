import sys
from pathlib import Path
import pandas as pd
import re

# ============================================================
# UTF-8 OUTPUT
# ============================================================

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ============================================================
# PATHS
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

allocation_file = (
    base_dir / "cleaned" / "Allocated_Limit_cleaned.csv"
)

calamity_file = (
    base_dir / "cleaned" / "Amount_consented_Calamity_cleaned.csv"
)

analysis_dir = base_dir / "analysis"
analysis_dir.mkdir(exist_ok=True)

# ============================================================
# CHECK FILES
# ============================================================

if not allocation_file.exists():
    print("ERROR: Allocated Limit cleaned file not found.")
    sys.exit(1)

if not calamity_file.exists():
    print("ERROR: Calamity cleaned file not found.")
    sys.exit(1)

# ============================================================
# LOAD
# ============================================================

print("Loading Allocated Limit...")
allocation = pd.read_csv(
    allocation_file,
    dtype=str,
    low_memory=False
)

print("Loading Calamity Consent...")
calamity = pd.read_csv(
    calamity_file,
    dtype=str,
    low_memory=False
)

# ============================================================
# NAME NORMALIZATION FUNCTION
# ============================================================

def normalize_mp_name(name):

    if pd.isna(name):
        return None

    name = str(name).upper().strip()

    # Remove punctuation
    name = re.sub(r"[^\w\s]", " ", name)

    # Remove common honorifics
    honorifics = [
        "SHRI",
        "SMT",
        "SMT.",
        "DR",
        "DR.",
        "ADV",
        "ADV.",
        "PROF",
        "PROF.",
        "MR",
        "MR.",
        "MRS",
        "MRS.",
        "MS",
        "MS."
    ]

    for title in honorifics:
        name = re.sub(
            rf"\b{re.escape(title.rstrip('.'))}\b",
            " ",
            name
        )

    # Normalize whitespace
    name = re.sub(r"\s+", " ", name).strip()

    return name


# ============================================================
# CREATE NORMALIZED NAMES
# ============================================================

allocation["mp_name_normalized"] = (
    allocation["mp_name"]
    .apply(normalize_mp_name)
)

calamity["mp_name_normalized"] = (
    calamity["mp_name"]
    .apply(normalize_mp_name)
)

# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n========== BASIC INFORMATION ==========")

print(
    f"Allocation MP records : "
    f"{len(allocation):,}"
)

print(
    f"Calamity records      : "
    f"{len(calamity):,}"
)

print(
    f"Unique Allocation MPs : "
    f"{allocation['mp_name_normalized'].nunique():,}"
)

print(
    f"Unique Calamity MPs   : "
    f"{calamity['mp_name_normalized'].nunique():,}"
)

# ============================================================
# MP SETS
# ============================================================

allocation_mps = set(
    allocation["mp_name_normalized"]
    .dropna()
    .unique()
)

calamity_mps = set(
    calamity["mp_name_normalized"]
    .dropna()
    .unique()
)

common_mps = allocation_mps & calamity_mps

only_allocation = allocation_mps - calamity_mps
only_calamity = calamity_mps - allocation_mps

# ============================================================
# COMPARISON
# ============================================================

print("\n========== MP NAME COMPARISON ==========")

print(
    f"Allocation MPs : "
    f"{len(allocation_mps):,}"
)

print(
    f"Calamity MPs   : "
    f"{len(calamity_mps):,}"
)

print(
    f"Common MPs     : "
    f"{len(common_mps):,}"
)

print(
    f"Only Allocation: "
    f"{len(only_allocation):,}"
)

print(
    f"Only Calamity  : "
    f"{len(only_calamity):,}"
)

if len(calamity_mps) > 0:

    match_percentage = (
        len(common_mps) /
        len(calamity_mps)
    ) * 100

    print(
        f"\nCalamity → Allocation MP match: "
        f"{match_percentage:.2f}%"
    )

# ============================================================
# CALAMITY MPS MATCHED TO ALLOCATION
# ============================================================

print("\n========== CALAMITY MPs MATCHED TO ALLOCATION ==========")

matched_names = sorted(common_mps)

for name in matched_names:
    print(name)

# ============================================================
# ONLY IN CALAMITY
# ============================================================

print("\n========== ONLY IN CALAMITY ==========")

if only_calamity:

    only_calamity_df = calamity[
        calamity["mp_name_normalized"].isin(
            only_calamity
        )
    ].copy()

    print(
        only_calamity_df[
            [
                "mp_name",
                "mp_name_normalized",
                "calamity_type",
                "calamity_name",
                "consent_date",
                "consent_amount"
            ]
        ]
        .to_string(index=False)
    )

else:

    print("No Calamity-only MPs.")

# ============================================================
# ONLY IN ALLOCATION
# ============================================================

print("\n========== ALLOCATION MPs WITHOUT CALAMITY ==========")

print(
    f"Allocation MPs without calamity record: "
    f"{len(only_allocation):,}"
)

# ============================================================
# DUPLICATE / AMBIGUITY CHECK
# ============================================================

print("\n========== NORMALIZED NAME DUPLICATE CHECK ==========")

allocation_name_counts = (
    allocation["mp_name_normalized"]
    .value_counts()
)

calamity_name_counts = (
    calamity["mp_name_normalized"]
    .value_counts()
)

allocation_duplicates = (
    allocation_name_counts[
        allocation_name_counts > 1
    ]
)

calamity_duplicates = (
    calamity_name_counts[
        calamity_name_counts > 1
    ]
)

print(
    f"Duplicate normalized names in Allocation: "
    f"{len(allocation_duplicates):,}"
)

if len(allocation_duplicates) > 0:

    print("\nAllocation duplicate examples:")

    print(
        allocation_duplicates
        .head(20)
        .to_string()
    )

print(
    f"\nRepeated normalized names in Calamity: "
    f"{len(calamity_duplicates):,}"
)

if len(calamity_duplicates) > 0:

    print("\nCalamity repeated-name examples:")

    print(
        calamity_duplicates
        .head(20)
        .to_string()
    )

# ============================================================
# MERGE TEST
# ============================================================

print("\n========== MERGE TEST ==========")

merged = calamity.merge(
    allocation[
        [
            "mp_name_normalized",
            "state",
            "constituency",
            "allocated_amount"
        ]
    ],
    on="mp_name_normalized",
    how="left",
    indicator=True
)

matched_rows = (
    merged["_merge"] == "both"
).sum()

unmatched_rows = (
    merged["_merge"] == "left_only"
).sum()

print(
    f"Calamity rows: "
    f"{len(calamity):,}"
)

print(
    f"Matched to Allocation: "
    f"{matched_rows:,}"
)

print(
    f"Unmatched: "
    f"{unmatched_rows:,}"
)

if len(calamity) > 0:

    row_match_percentage = (
        matched_rows /
        len(calamity)
    ) * 100

    print(
        f"Calamity row match: "
        f"{row_match_percentage:.2f}%"
    )

# ============================================================
# SAVE MERGE TEST
# ============================================================

merge_output = (
    analysis_dir /
    "calamity_allocation_merge_test.csv"
)

merged.to_csv(
    merge_output,
    index=False
)

print("\nMerge test saved to:")
print(merge_output)

# ============================================================
# SAVE ONLY CALAMITY MPs
# ============================================================

only_calamity_output = (
    analysis_dir /
    "calamity_mps_not_in_allocation.csv"
)

calamity[
    calamity["mp_name_normalized"].isin(
        only_calamity
    )
].to_csv(
    only_calamity_output,
    index=False
)

print("\nCalamity-only MPs saved to:")
print(only_calamity_output)

# ============================================================
# COMPLETE
# ============================================================

print("\n========== COMPLETE ==========")