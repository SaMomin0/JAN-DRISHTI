from pathlib import Path
import pandas as pd


# ============================================================
# 1. PATHS
# ============================================================

base_dir = Path(__file__).resolve().parent.parent

recommended_file = (
    base_dir
    / "cleaned"
    / "Works Recommended_cleaned.csv"
)

sanctioned_file = (
    base_dir
    / "cleaned"
    / "Works Sanctioned_cleaned.csv"
)


# ============================================================
# 2. LOAD
# ============================================================

print("Loading Recommended...")
recommended = pd.read_csv(
    recommended_file,
    dtype={"work_id": "string"},
    low_memory=False
)

print("Loading Sanctioned...")
sanctioned = pd.read_csv(
    sanctioned_file,
    dtype={"work_id": "string"},
    low_memory=False
)


# ============================================================
# 3. GET WORK IDs
# ============================================================

recommended_ids = set(
    recommended.loc[
        recommended["work_id"].notna(),
        "work_id"
    ]
)

sanctioned_ids = set(
    sanctioned.loc[
        sanctioned["work_id"].notna(),
        "work_id"
    ]
)


# ============================================================
# 4. BASIC COMPARISON
# ============================================================

common_ids = recommended_ids & sanctioned_ids

only_recommended = recommended_ids - sanctioned_ids

only_sanctioned = sanctioned_ids - recommended_ids


print("\n========== DATASET COMPARISON ==========")

print("Recommended Work IDs :", len(recommended_ids))
print("Sanctioned Work IDs  :", len(sanctioned_ids))
print("Common Work IDs      :", len(common_ids))

print(
    "Only in Recommended  :",
    len(only_recommended)
)

print(
    "Only in Sanctioned   :",
    len(only_sanctioned)
)


# ============================================================
# 5. PERCENTAGE MATCH
# ============================================================

if len(recommended_ids) > 0:

    match_percentage = (
        len(common_ids)
        / len(recommended_ids)
        * 100
    )

    print(
        f"\nRecommended → Sanctioned ID match: "
        f"{match_percentage:.2f}%"
    )


# ============================================================
# 6. SHOW IDs ONLY IN RECOMMENDED
# ============================================================

print("\n========== ONLY IN RECOMMENDED ==========")

only_rec_df = recommended[
    recommended["work_id"].isin(only_recommended)
].copy()

print(
    only_rec_df[
        [
            "work_id",
            "work",
            "mp_name",
            "constituency",
            "recommended_date",
            "recommended_amount",
            "sanction_date",
            "work_status"
        ]
    ]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# 7. SHOW IDs ONLY IN SANCTIONED
# ============================================================

print("\n========== ONLY IN SANCTIONED ==========")

only_san_df = sanctioned[
    sanctioned["work_id"].isin(only_sanctioned)
].copy()

print(
    only_san_df[
        [
            "work_id",
            "work",
            "mp_name",
            "constituency",
            "recommended_date",
            "sanction_date",
            "sanction_amount",
            "work_status"
        ]
    ]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# 8. COMPARE MATCHED AMOUNTS
# ============================================================

print("\n========== MATCHED RECORD COMPARISON ==========")

rec_match = recommended[
    recommended["work_id"].isin(common_ids)
][
    [
        "work_id",
        "recommended_amount",
        "recommended_date",
        "sanction_date"
    ]
].copy()

san_match = sanctioned[
    sanctioned["work_id"].isin(common_ids)
][
    [
        "work_id",
        "sanction_amount",
        "recommended_date",
        "sanction_date"
    ]
].copy()


# Merge
comparison = rec_match.merge(
    san_match,
    on="work_id",
    how="inner",
    suffixes=("_recommended", "_sanctioned")
)


# ============================================================
# 9. AMOUNT DIFFERENCE
# ============================================================

comparison["amount_difference"] = (
    comparison["sanction_amount"]
    - comparison["recommended_amount"]
)


print(
    "Matched records:",
    len(comparison)
)

print(
    "Amount differences:",
    (
        comparison["amount_difference"] != 0
    ).sum()
)


# ============================================================
# 10. SHOW AMOUNT DIFFERENCES
# ============================================================

print("\n========== AMOUNT DIFFERENCES ==========")

amount_difference_df = comparison[
    comparison["amount_difference"] != 0
]

print(
    amount_difference_df
    .head(20)
    .to_string(index=False)
)


# ============================================================
# 11. DATE DIFFERENCES
# ============================================================

print("\n========== DATE DIFFERENCES ==========")

comparison["recommended_date_recommendation"] = pd.to_datetime(
    comparison["recommended_date_recommended"],
    errors="coerce"
)

comparison["recommended_date_sanctioned"] = pd.to_datetime(
    comparison["recommended_date_sanctioned"],
    errors="coerce"
)

comparison["sanction_date_recommendation"] = pd.to_datetime(
    comparison["sanction_date_recommended"],
    errors="coerce"
)

comparison["sanction_date_sanctioned"] = pd.to_datetime(
    comparison["sanction_date_sanctioned"],
    errors="coerce"
)


recommended_date_difference = (
    comparison["recommended_date_recommendation"]
    != comparison["recommended_date_sanctioned"]
).sum()

sanction_date_difference = (
    comparison["sanction_date_recommendation"]
    != comparison["sanction_date_sanctioned"]
).sum()


print(
    "Recommended date differences:",
    recommended_date_difference
)

print(
    "Sanction date differences:",
    sanction_date_difference
)


# ============================================================
# 12. SAVE COMPARISON RESULTS
# ============================================================

comparison_file = (
    base_dir
    / "analysis"
    / "recommended_vs_sanctioned.csv"
)

comparison_file.parent.mkdir(exist_ok=True)

comparison.to_csv(
    comparison_file,
    index=False,
    encoding="utf-8-sig"
)


# ============================================================
# 13. SAVE ONLY-IN FILES
# ============================================================

only_rec_file = (
    base_dir
    / "analysis"
    / "only_in_recommended.csv"
)

only_san_file = (
    base_dir
    / "analysis"
    / "only_in_sanctioned.csv"
)

only_rec_df.to_csv(
    only_rec_file,
    index=False,
    encoding="utf-8-sig"
)

only_san_df.to_csv(
    only_san_file,
    index=False,
    encoding="utf-8-sig"
)


# ============================================================
# 14. COMPLETE
# ============================================================

print("\n========== COMPLETE ==========")

print("Comparison saved to:")
print(comparison_file)

print("\nOnly Recommended saved to:")
print(only_rec_file)

print("\nOnly Sanctioned saved to:")
print(only_san_file)