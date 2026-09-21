import sqlite3
import re
from pathlib import Path
import pandas as pd


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CLEANED_DIR = BASE_DIR / "cleaned"
DATABASE_DIR = BASE_DIR / "database"

DATABASE_DIR.mkdir(exist_ok=True)

DB_FILE = DATABASE_DIR / "mplads.db"


# ============================================================
# 2. INPUT FILES
# ============================================================

FILES = {
    "recommended": CLEANED_DIR / "Works Recommended_cleaned.csv",
    "sanctioned": CLEANED_DIR / "Works Sanctioned_cleaned.csv",
    "expenditure": CLEANED_DIR / "Expenditure_cleaned.csv",
    "completed": CLEANED_DIR / "Works Completed_cleaned.csv",
    "allocation": CLEANED_DIR / "Allocated_Limit_cleaned.csv",
    "calamity": CLEANED_DIR / "Amount_consented_Calamity_cleaned.csv",
}


# ============================================================
# 3. CHECK INPUT FILES
# ============================================================

print("=" * 70)
print("MPLADS MASTER DATABASE BUILDER")
print("=" * 70)

for name, path in FILES.items():

    if not path.exists():

        print("\nERROR: Missing file:")
        print(path)

        raise SystemExit(1)

print("\nAll six cleaned datasets found.")


# ============================================================
# 4. LOAD DATASETS
# ============================================================

print("\nLoading datasets...")

recommended = pd.read_csv(
    FILES["recommended"],
    dtype=str,
    low_memory=False
)

sanctioned = pd.read_csv(
    FILES["sanctioned"],
    dtype=str,
    low_memory=False
)

expenditure = pd.read_csv(
    FILES["expenditure"],
    dtype=str,
    low_memory=False
)

completed = pd.read_csv(
    FILES["completed"],
    dtype=str,
    low_memory=False
)

allocation = pd.read_csv(
    FILES["allocation"],
    dtype=str,
    low_memory=False
)

calamity = pd.read_csv(
    FILES["calamity"],
    dtype=str,
    low_memory=False
)

print("Datasets loaded successfully.")


# ============================================================
# 5. HELPER FUNCTIONS
# ============================================================

def clean_text(value):

    if pd.isna(value):
        return None

    value = str(value).strip()

    if value == "":
        return None

    if value.upper() in [
        "NAN",
        "NONE",
        "NULL"
    ]:
        return None

    return value


def normalize_mp_name(name):

    if pd.isna(name):
        return None

    name = str(name).upper().strip()

    # Remove punctuation
    name = re.sub(
        r"[^\w\s]",
        " ",
        name
    )

    # Common honorifics
    honorifics = [
        "SHRI",
        "SMT",
        "DR",
        "ADV",
        "PROF",
        "MR",
        "MRS",
        "MS"
    ]

    for title in honorifics:

        name = re.sub(
            rf"\b{re.escape(title)}\b",
            " ",
            name
        )

    # Normalize spaces
    name = re.sub(
        r"\s+",
        " ",
        name
    ).strip()

    if name == "":
        return None

    return name


def extract_work_id(value):

    """
    Convert an MPLADS Work value into canonical numeric work_id.

    Handles BOTH formats:

    1. Already-cleaned numeric ID

       133166

       -> 133166


    2. Full MPLADS Work ID

       WS/MP620/2024-2025/133166

       -> 133166


    3. Full Work ID + description

       WS/MP620/2024-2025/133166-Construction...

       -> 133166
    """

    if pd.isna(value):
        return None

    value = str(value).strip()

    if value == "":
        return None


    # --------------------------------------------------------
    # CASE 1
    # Already numeric
    # --------------------------------------------------------

    if re.fullmatch(
        r"\d+",
        value
    ):

        return value


    # --------------------------------------------------------
    # CASE 2
    # Full MPLADS ID
    #
    # Example:
    # WS/MP620/2024-2025/133166
    # --------------------------------------------------------

    matches = re.findall(
        r"/(\d+)(?:-|$)",
        value
    )

    if matches:

        return matches[-1]


    # --------------------------------------------------------
    # CASE 3
    # Fallback
    #
    # Find numeric groups and use the last one.
    # --------------------------------------------------------

    matches = re.findall(
        r"(\d+)",
        value
    )

    if matches:

        return matches[-1]


    return None


# ============================================================
# 6. NORMALIZE MP NAMES
# ============================================================

print("\nNormalizing MP names...")

allocation["mp_name_normalized"] = (
    allocation["mp_name"]
    .apply(normalize_mp_name)
)

calamity["mp_name_normalized"] = (
    calamity["mp_name"]
    .apply(normalize_mp_name)
)


# ============================================================
# 7. CREATE MP MASTER TABLE
# ============================================================

print("\nCreating MP master table...")

mp = allocation[
    [
        "mp_name_normalized",
        "mp_name",
        "state",
        "constituency",
        "allocated_amount"
    ]
].copy()


mp = mp.rename(
    columns={
        "mp_name_normalized": "mp_key"
    }
)


# Clean text fields

for column in [
    "mp_key",
    "mp_name",
    "state",
    "constituency"
]:

    mp[column] = (
        mp[column]
        .apply(clean_text)
    )


# Convert allocated amount

mp["allocated_amount"] = pd.to_numeric(
    mp["allocated_amount"],
    errors="coerce"
)


# Remove duplicate MP keys

mp = mp.drop_duplicates(
    subset=["mp_key"],
    keep="first"
).reset_index(drop=True)


# Internal MP ID

mp.insert(
    0,
    "mp_id",
    range(
        1,
        len(mp) + 1
    )
)


print(
    f"MP master records: {len(mp):,}"
)


# ============================================================
# 8. MP LOOKUP
# ============================================================

mp_lookup = dict(
    zip(
        mp["mp_key"],
        mp["mp_id"]
    )
)


# ============================================================
# 9. EXTRACT WORK IDs
# ============================================================

print("\nExtracting canonical Work IDs...")


# Recommended

recommended["work_id"] = (
    recommended["work_id"]
    .apply(extract_work_id)
)


# Sanctioned

sanctioned["work_id"] = (
    sanctioned["work_id"]
    .apply(extract_work_id)
)


# Expenditure

expenditure["work_id"] = (
    expenditure["work_id"]
    .apply(extract_work_id)
)


# Completed

completed["work_id"] = (
    completed["work_id"]
    .apply(extract_work_id)
)


print(
    f"Recommended Work IDs extracted: "
    f"{recommended['work_id'].notna().sum():,}"
)

print(
    f"Sanctioned Work IDs extracted: "
    f"{sanctioned['work_id'].notna().sum():,}"
)

print(
    f"Expenditure Work IDs extracted: "
    f"{expenditure['work_id'].notna().sum():,}"
)

print(
    f"Completed Work IDs extracted: "
    f"{completed['work_id'].notna().sum():,}"
)


# ============================================================
# 10. CREATE WORK MASTER
# ============================================================

print("\nCreating work master...")

work = sanctioned.copy()


# Expected columns from cleaned Sanctioned dataset

work_columns = [
    "work_id",
    "work_category",
    "work",
    "state",
    "ida",
    "mp_name",
    "constituency",
    "work_description",
    "recommended_date",
    "sanction_date",
    "sanction_amount",
    "work_status"
]


# Keep only columns that exist

work = work[
    [
        column
        for column in work_columns
        if column in work.columns
    ]
].copy()


# Clean text columns

for column in [
    "work_id",
    "work_category",
    "work",
    "state",
    "ida",
    "mp_name",
    "constituency",
    "work_description",
    "work_status"
]:

    if column in work.columns:

        work[column] = (
            work[column]
            .apply(clean_text)
        )


# Normalize MP

work["mp_key"] = (
    work["mp_name"]
    .apply(normalize_mp_name)
)


# Link work → MP

work["mp_id"] = (
    work["mp_key"]
    .map(mp_lookup)
)


# Sanction amount

work["sanction_amount"] = pd.to_numeric(
    work["sanction_amount"],
    errors="coerce"
)


# Dates

for column in [
    "recommended_date",
    "sanction_date"
]:

    work[column] = (
        pd.to_datetime(
            work[column],
            errors="coerce"
        )
        .dt.strftime("%Y-%m-%d")
    )


# Remove duplicate Work IDs

work = work.drop_duplicates(
    subset=["work_id"],
    keep="first"
).reset_index(drop=True)


print(
    f"Work master records: {len(work):,}"
)


# ============================================================
# 11. CREATE EXPENDITURE TRANSACTION TABLE
# ============================================================

print(
    "\nCreating expenditure transaction table..."
)


expenditure_transaction = pd.DataFrame()


# Work ID

expenditure_transaction["work_id"] = (
    expenditure["work_id"]
)


# MP key

expenditure_transaction["mp_key"] = (
    expenditure["mp_name"]
    .apply(normalize_mp_name)
)


# MP ID

expenditure_transaction["mp_id"] = (
    expenditure_transaction["mp_key"]
    .map(mp_lookup)
)


# State

expenditure_transaction["state"] = (
    expenditure["state"]
    .apply(clean_text)
)


# IDA

expenditure_transaction["ida"] = (
    expenditure["ida"]
    .apply(clean_text)
)


# MP name

expenditure_transaction["mp_name"] = (
    expenditure["mp_name"]
    .apply(clean_text)
)


# Constituency

expenditure_transaction["constituency"] = (
    expenditure["constituency"]
    .apply(clean_text)
)


# Expenditure date

expenditure_transaction["expenditure_date"] = (
    pd.to_datetime(
        expenditure["expenditure_date"],
        errors="coerce"
    )
    .dt.strftime("%Y-%m-%d")
)


# Vendor

expenditure_transaction["vendor_name"] = (
    expenditure["vendor_name"]
    .apply(clean_text)
)


# Payment status

expenditure_transaction["payment_status"] = (
    expenditure["payment_status"]
    .apply(clean_text)
)


# Amount

expenditure_transaction["fund_disbursed_amount"] = (
    pd.to_numeric(
        expenditure["fund_disbursed_amount"],
        errors="coerce"
    )
)


# Transaction ID

expenditure_transaction.insert(
    0,
    "transaction_id",
    range(
        1,
        len(expenditure_transaction) + 1
    )
)


print(
    f"Expenditure transactions: "
    f"{len(expenditure_transaction):,}"
)


# ============================================================
# 12. CREATE COMPLETION TABLE
# ============================================================

print("\nCreating completion table...")


completion = pd.DataFrame()


# Work ID

completion["work_id"] = (
    completed["work_id"]
)


# MP key

completion["mp_key"] = (
    completed["mp_name"]
    .apply(normalize_mp_name)
)


# MP ID

completion["mp_id"] = (
    completion["mp_key"]
    .map(mp_lookup)
)


# State

completion["state"] = (
    completed["state"]
    .apply(clean_text)
)


# IDA

completion["ida"] = (
    completed["ida"]
    .apply(clean_text)
)


# MP name

completion["mp_name"] = (
    completed["mp_name"]
    .apply(clean_text)
)


# Constituency

completion["constituency"] = (
    completed["constituency"]
    .apply(clean_text)
)


# Description

completion["work_description"] = (
    completed["work_description"]
    .apply(clean_text)
)


# Completion date

completion["completion_date"] = (
    pd.to_datetime(
        completed["completion_date"],
        errors="coerce"
    )
    .dt.strftime("%Y-%m-%d")
)


# Image

completion["image"] = (
    completed["image"]
    .apply(clean_text)
)


# Amount

completion["amount_disbursed"] = (
    pd.to_numeric(
        completed["amount_disbursed"],
        errors="coerce"
    )
)


# Remove duplicate Work IDs

completion = completion.drop_duplicates(
    subset=["work_id"],
    keep="first"
).reset_index(drop=True)


# Completion ID

completion.insert(
    0,
    "completion_id",
    range(
        1,
        len(completion) + 1
    )
)


print(
    f"Completion records: "
    f"{len(completion):,}"
)


# ============================================================
# 13. CREATE CALAMITY CONSENT TABLE
# ============================================================

print("\nCreating calamity consent table...")


calamity_consent = pd.DataFrame()


# MP key

calamity_consent["mp_key"] = (
    calamity["mp_name_normalized"]
)


# MP ID

calamity_consent["mp_id"] = (
    calamity["mp_name_normalized"]
    .map(mp_lookup)
)


# MP name

calamity_consent["mp_name"] = (
    calamity["mp_name"]
    .apply(clean_text)
)


# Calamity type

calamity_consent["calamity_type"] = (
    calamity["calamity_type"]
    .apply(clean_text)
)


# Calamity name

calamity_consent["calamity_name"] = (
    calamity["calamity_name"]
    .apply(clean_text)
)


# Consent date

calamity_consent["consent_date"] = (
    pd.to_datetime(
        calamity["consent_date"],
        errors="coerce"
    )
    .dt.strftime("%Y-%m-%d")
)


# Consent amount

calamity_consent["consent_amount"] = (
    pd.to_numeric(
        calamity["consent_amount"],
        errors="coerce"
    )
)


# Consent ID

calamity_consent.insert(
    0,
    "consent_id",
    range(
        1,
        len(calamity_consent) + 1
    )
)


print(
    f"Calamity consent records: "
    f"{len(calamity_consent):,}"
)


# ============================================================
# 14. CREATE DATABASE
# ============================================================

print("\nCreating SQLite database...")


# Rebuild database cleanly

if DB_FILE.exists():

    DB_FILE.unlink()


connection = sqlite3.connect(
    DB_FILE
)

cursor = connection.cursor()


# ============================================================
# 15. WRITE TABLES
# ============================================================

print("\nWriting tables...")


mp.to_sql(
    "mp",
    connection,
    if_exists="replace",
    index=False
)


work.to_sql(
    "work",
    connection,
    if_exists="replace",
    index=False
)


expenditure_transaction.to_sql(
    "expenditure_transaction",
    connection,
    if_exists="replace",
    index=False
)


completion.to_sql(
    "completion",
    connection,
    if_exists="replace",
    index=False
)


calamity_consent.to_sql(
    "calamity_consent",
    connection,
    if_exists="replace",
    index=False
)


# ============================================================
# 16. CREATE INDEXES
# ============================================================

print("\nCreating indexes...")


cursor.execute("""
CREATE UNIQUE INDEX idx_mp_key
ON mp(mp_key)
""")


cursor.execute("""
CREATE UNIQUE INDEX idx_work_id
ON work(work_id)
""")


cursor.execute("""
CREATE INDEX idx_work_mp_id
ON work(mp_id)
""")


cursor.execute("""
CREATE INDEX idx_expenditure_work_id
ON expenditure_transaction(work_id)
""")


cursor.execute("""
CREATE INDEX idx_expenditure_mp_id
ON expenditure_transaction(mp_id)
""")


cursor.execute("""
CREATE INDEX idx_completion_work_id
ON completion(work_id)
""")


cursor.execute("""
CREATE INDEX idx_completion_mp_id
ON completion(mp_id)
""")


cursor.execute("""
CREATE INDEX idx_calamity_mp_id
ON calamity_consent(mp_id)
""")


connection.commit()


# ============================================================
# 17. DATABASE VALIDATION
# ============================================================

print(
    "\n" + "=" * 70
)

print("DATABASE VALIDATION")

print(
    "=" * 70
)


tables = [
    "mp",
    "work",
    "expenditure_transaction",
    "completion",
    "calamity_consent"
]


for table in tables:

    count = cursor.execute(
        f"""
        SELECT COUNT(*)
        FROM {table}
        """
    ).fetchone()[0]

    print(
        f"{table:30} : {count:,} records"
    )


# ============================================================
# 18. RELATIONSHIP VALIDATION
# ============================================================

print(
    "\n========== RELATIONSHIP VALIDATION =========="
)


# ------------------------------------------------------------
# WORK → MP
# ------------------------------------------------------------

work_mp_count = cursor.execute("""
SELECT COUNT(*)
FROM work
WHERE mp_id IS NOT NULL
""").fetchone()[0]


print(
    f"Works linked to MP: "
    f"{work_mp_count:,} / {len(work):,}"
)


# ------------------------------------------------------------
# EXPENDITURE → WORK
# ------------------------------------------------------------

expense_work_count = cursor.execute("""
SELECT COUNT(*)
FROM expenditure_transaction e
WHERE EXISTS (
    SELECT 1
    FROM work w
    WHERE w.work_id = e.work_id
)
""").fetchone()[0]


print(
    f"Expenditure linked to Work: "
    f"{expense_work_count:,} / "
    f"{len(expenditure_transaction):,}"
)


# ------------------------------------------------------------
# COMPLETION → WORK
# ------------------------------------------------------------

completion_work_count = cursor.execute("""
SELECT COUNT(*)
FROM completion c
WHERE EXISTS (
    SELECT 1
    FROM work w
    WHERE w.work_id = c.work_id
)
""").fetchone()[0]


print(
    f"Completion linked to Work: "
    f"{completion_work_count:,} / "
    f"{len(completion):,}"
)


# ------------------------------------------------------------
# CALAMITY → MP
# ------------------------------------------------------------

calamity_mp_count = cursor.execute("""
SELECT COUNT(*)
FROM calamity_consent
WHERE mp_id IS NOT NULL
""").fetchone()[0]


print(
    f"Calamity linked to MP: "
    f"{calamity_mp_count:,} / "
    f"{len(calamity_consent):,}"
)


# ============================================================
# 19. UNMATCHED EXPENDITURE
# ============================================================

unmatched_expense = cursor.execute("""
SELECT COUNT(*)
FROM expenditure_transaction e
LEFT JOIN work w
    ON e.work_id = w.work_id
WHERE w.work_id IS NULL
""").fetchone()[0]


print(
    f"\nUnmatched expenditure Work IDs: "
    f"{unmatched_expense:,}"
)


# ============================================================
# 20. UNMATCHED COMPLETION
# ============================================================

unmatched_completion = cursor.execute("""
SELECT COUNT(*)
FROM completion c
LEFT JOIN work w
    ON c.work_id = w.work_id
WHERE w.work_id IS NULL
""").fetchone()[0]


print(
    f"Unmatched completion Work IDs: "
    f"{unmatched_completion:,}"
)


# ============================================================
# 21. UNMATCHED WORK MPs
# ============================================================

unmatched_work_mp = cursor.execute("""
SELECT COUNT(*)
FROM work
WHERE mp_id IS NULL
""").fetchone()[0]


print(
    f"Unmatched Work MPs: "
    f"{unmatched_work_mp:,}"
)


# ============================================================
# 22. UNMATCHED CALAMITY MPs
# ============================================================

unmatched_calamity_mp = cursor.execute("""
SELECT COUNT(*)
FROM calamity_consent
WHERE mp_id IS NULL
""").fetchone()[0]


print(
    f"Unmatched Calamity MPs: "
    f"{unmatched_calamity_mp:,}"
)


# ============================================================
# 23. FINANCIAL TOTALS
# ============================================================

total_expenditure = cursor.execute("""
SELECT SUM(fund_disbursed_amount)
FROM expenditure_transaction
""").fetchone()[0]


total_allocation = cursor.execute("""
SELECT SUM(allocated_amount)
FROM mp
""").fetchone()[0]


total_calamity = cursor.execute("""
SELECT SUM(consent_amount)
FROM calamity_consent
""").fetchone()[0]


print(
    "\n========== FINANCIAL TOTALS =========="
)


print(
    f"Total expenditure: "
    f"₹{total_expenditure:,.2f}"
)


print(
    f"Total MP allocation: "
    f"₹{total_allocation:,.2f}"
)


print(
    f"Total calamity consent: "
    f"₹{total_calamity:,.2f}"
)


# ============================================================
# 24. WORK STATUS SUMMARY
# ============================================================

print(
    "\n========== WORK STATUS SUMMARY =========="
)


status_rows = cursor.execute("""
SELECT
    work_status,
    COUNT(*) AS work_count
FROM work
GROUP BY work_status
ORDER BY work_count DESC
""").fetchall()


for status, count in status_rows:

    print(
        f"{str(status):30} : {count:,}"
    )


# ============================================================
# 25. COMPLETION COVERAGE
# ============================================================

completed_count = cursor.execute("""
SELECT COUNT(*)
FROM work w
WHERE EXISTS (
    SELECT 1
    FROM completion c
    WHERE c.work_id = w.work_id
)
""").fetchone()[0]


total_work = cursor.execute("""
SELECT COUNT(*)
FROM work
""").fetchone()[0]


coverage = (
    completed_count / total_work * 100
    if total_work
    else 0
)


print(
    f"\nCompletion records linked to works: "
    f"{completed_count:,} / {total_work:,}"
)


print(
    f"Completion record coverage: "
    f"{coverage:.2f}%"
)


# ============================================================
# 26. FINAL INTEGRITY CHECK
# ============================================================

print(
    "\n========== FINAL INTEGRITY CHECK =========="
)


checks = {

    "MP records": len(mp) == 543,

    "Work records": len(work) == 80733,

    "Expenditure records":
        len(expenditure_transaction) == 85424,

    "Completion records":
        len(completion) == 35292,

    "Calamity records":
        len(calamity_consent) == 12,

    "All works linked to MP":
        work_mp_count == len(work),

    "All expenditure linked to Work":
        expense_work_count == len(expenditure_transaction),

    "All completion linked to Work":
        completion_work_count == len(completion),

    "All calamity linked to MP":
        calamity_mp_count == len(calamity_consent),

    "No unmatched expenditure":
        unmatched_expense == 0,

    "No unmatched completion":
        unmatched_completion == 0,

    "No unmatched Work MPs":
        unmatched_work_mp == 0,

    "No unmatched Calamity MPs":
        unmatched_calamity_mp == 0
}


all_passed = True


for check_name, result in checks.items():

    if result:

        print(
            f"  PASS  ✓  {check_name}"
        )

    else:

        print(
            f"  FAIL  ✗  {check_name}"
        )

        all_passed = False


# ============================================================
# 27. CLOSE DATABASE
# ============================================================

connection.close()


# ============================================================
# 28. FINAL RESULT
# ============================================================

print(
    "\n" + "=" * 70
)

if all_passed:

    print(
        "ALL DATABASE INTEGRITY CHECKS PASSED ✓"
    )

else:

    print(
        "DATABASE CREATED, BUT SOME INTEGRITY CHECKS FAILED ✗"
    )

print(
    "=" * 70
)


print("\nDatabase created at:")

print(DB_FILE)


print("\nTables created:")

for table in tables:

    print(
        f"  ✓ {table}"
    )


print("\nDONE.")
