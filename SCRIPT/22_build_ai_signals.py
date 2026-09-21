import sqlite3
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ==============================================================
# MPLADS AI SIGNAL BUILDER
# Transparent, explainable monitoring signals
# ==============================================================

BASE_DIR = Path(r"D:\SIH_2026")
DB_PATH = BASE_DIR / "database" / "mplads.db"

print("=" * 70)
print("MPLADS AI SIGNAL BUILDER")
print("=" * 70)

# --------------------------------------------------------------
# DATABASE CHECK
# --------------------------------------------------------------

if not DB_PATH.exists():
    print(f"\nERROR: Database not found:")
    print(DB_PATH)
    raise SystemExit(1)

print(f"\nDatabase found:")
print(DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

print("\nConnected to database.")

cur = conn.cursor()

# --------------------------------------------------------------
# REMOVE OLD SIGNAL TABLE
# --------------------------------------------------------------

print("\nRemoving old AI signal table...")

cur.execute("""
DROP TABLE IF EXISTS ai_signal
""")

# --------------------------------------------------------------
# CREATE SIGNAL TABLE
# --------------------------------------------------------------

print("Creating: ai_signal")

cur.execute("""
CREATE TABLE ai_signal (
    signal_id INTEGER PRIMARY KEY AUTOINCREMENT,

    signal_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,

    mp_name TEXT,
    state TEXT,
    constituency TEXT,

    severity TEXT NOT NULL,

    reason TEXT NOT NULL,

    supporting_value REAL,
    threshold_value REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")

# ==============================================================
# HELPER FUNCTION
# ==============================================================

def insert_signal(
    signal_type,
    entity_type,
    entity_id,
    mp_name,
    state,
    constituency,
    severity,
    reason,
    supporting_value=None,
    threshold_value=None
):
    cur.execute("""
        INSERT INTO ai_signal (
            signal_type,
            entity_type,
            entity_id,
            mp_name,
            state,
            constituency,
            severity,
            reason,
            supporting_value,
            threshold_value
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        signal_type,
        entity_type,
        str(entity_id),
        mp_name,
        state,
        constituency,
        severity,
        reason,
        supporting_value,
        threshold_value
    ))


# ==============================================================
# 1. NO EXPENDITURE
# ==============================================================

print("\n[1/9] Building NO_EXPENDITURE signals...")

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    sanction_amount,
    work_status
FROM monitoring_work
WHERE no_expenditure_record = 1
""").fetchall()

for r in rows:

    reason = (
        f"No expenditure transaction is present for this work. "
        f"Sanction amount is ₹{(r['sanction_amount'] or 0):,.2f}. "
        f"Current source-reported status: {r['work_status']}."
    )

    insert_signal(
        signal_type="NO_EXPENDITURE",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="INFO",
        reason=reason,
        supporting_value=0,
        threshold_value=0
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 2. EXPENDITURE WITHOUT COMPLETION
# ==============================================================

print("\n[2/9] Building EXPENDITURE_WITHOUT_COMPLETION signals...")

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    total_expenditure,
    sanction_amount,
    expenditure_transaction_count
FROM monitoring_work
WHERE expenditure_without_completion_record = 1
""").fetchall()

for r in rows:

    ratio = None

    if r["sanction_amount"] and r["sanction_amount"] > 0:
        ratio = (
            r["total_expenditure"]
            / r["sanction_amount"]
        ) * 100

    reason = (
        f"Expenditure of ₹{(r['total_expenditure'] or 0):,.2f} "
        f"has been recorded across "
        f"{r['expenditure_transaction_count']} transaction(s), "
        f"but no completion record is present in the completion dataset."
    )

    insert_signal(
        signal_type="EXPENDITURE_WITHOUT_COMPLETION",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="REVIEW",
        reason=reason,
        supporting_value=ratio,
        threshold_value=100
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 3. PAYMENT IN PROGRESS
# ==============================================================

print("\n[3/9] Building PAYMENT_IN_PROGRESS signals...")

rows = cur.execute("""
SELECT
    e.work_id,
    w.mp_name,
    w.state,
    w.constituency,
    COUNT(*) AS transaction_count,
    SUM(e.fund_disbursed_amount) AS total_amount
FROM expenditure_transaction e
JOIN work w
    ON e.work_id = w.work_id
WHERE LOWER(TRIM(e.payment_status))
      = 'payment in-progress'
GROUP BY
    e.work_id,
    w.mp_name,
    w.state,
    w.constituency
""").fetchall()

for r in rows:

    reason = (
        f"This work has {r['transaction_count']} "
        f"payment transaction(s) with Payment In-Progress status, "
        f"totalling ₹{(r['total_amount'] or 0):,.2f}."
    )

    insert_signal(
        signal_type="PAYMENT_IN_PROGRESS",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="REVIEW",
        reason=reason,
        supporting_value=r["total_amount"],
        threshold_value=0
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 4. MULTIPLE TRANSACTIONS
# ==============================================================

print("\n[4/9] Building MULTIPLE_TRANSACTIONS signals...")

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    expenditure_transaction_count,
    total_expenditure
FROM monitoring_work
WHERE expenditure_transaction_count > 1
""").fetchall()

for r in rows:

    reason = (
        f"This work has {r['expenditure_transaction_count']} "
        f"expenditure transactions totalling "
        f"₹{(r['total_expenditure'] or 0):,.2f}."
    )

    insert_signal(
        signal_type="MULTIPLE_TRANSACTIONS",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="INFO",
        reason=reason,
        supporting_value=r["expenditure_transaction_count"],
        threshold_value=1
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 5. HIGH EXPENDITURE RATIO
# ==============================================================

print("\n[5/9] Building HIGH_EXPENDITURE_RATIO signals...")

# Transparent threshold:
# 90% or more of sanctioned amount spent.

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    total_expenditure,
    sanction_amount,
    expenditure_vs_sanction_percent
FROM monitoring_work
WHERE expenditure_vs_sanction_percent >= 90
  AND sanction_amount > 0
""").fetchall()

for r in rows:

    ratio = r["expenditure_vs_sanction_percent"]

    reason = (
        f"Recorded expenditure is "
        f"{ratio:.2f}% of the sanctioned amount. "
        f"Expenditure: ₹{(r['total_expenditure'] or 0):,.2f}; "
        f"Sanction: ₹{(r['sanction_amount'] or 0):,.2f}."
    )

    insert_signal(
        signal_type="HIGH_EXPENDITURE_RATIO",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="INFO",
        reason=reason,
        supporting_value=ratio,
        threshold_value=90
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 6. LONG SANCTION TO FIRST EXPENDITURE
# ==============================================================

print("\n[6/9] Building LONG_SANCTION_TO_EXPENDITURE signals...")

# Transparent threshold:
# 180 days or more.

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    days_sanction_to_first_expenditure
FROM monitoring_work
WHERE days_sanction_to_first_expenditure >= 180
""").fetchall()

for r in rows:

    days = r["days_sanction_to_first_expenditure"]

    reason = (
        f"{days} days elapsed between the sanction date "
        f"and the first recorded expenditure transaction."
    )

    insert_signal(
        signal_type="LONG_SANCTION_TO_EXPENDITURE",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="REVIEW",
        reason=reason,
        supporting_value=days,
        threshold_value=180
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 7. LONG SANCTION TO COMPLETION
# ==============================================================

print("\n[7/9] Building LONG_SANCTION_TO_COMPLETION signals...")

# Transparent threshold:
# 365 days or more.

rows = cur.execute("""
SELECT
    work_id,
    mp_name,
    state,
    constituency,
    days_sanction_to_completion
FROM monitoring_work
WHERE days_sanction_to_completion >= 365
""").fetchall()

for r in rows:

    days = r["days_sanction_to_completion"]

    reason = (
        f"{days} days elapsed between the sanction date "
        f"and the recorded completion date."
    )

    insert_signal(
        signal_type="LONG_SANCTION_TO_COMPLETION",
        entity_type="WORK",
        entity_id=r["work_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="INFO",
        reason=reason,
        supporting_value=days,
        threshold_value=365
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 8. VENDOR CONCENTRATION
# ==============================================================

print("\n[8/9] Building VENDOR_CONCENTRATION signals...")

# Threshold:
# Vendor has >= 50 works OR >= ₹1 crore total expenditure.

rows = cur.execute("""
SELECT
    vendor_name,
    total_works,
    total_amount_received
FROM monitoring_vendor
WHERE total_works >= 50
   OR total_amount_received >= 10000000
ORDER BY total_amount_received DESC
""").fetchall()

for r in rows:

    if r["total_works"] >= 50:
        reason = (
            f"Vendor is associated with {r['total_works']} works "
            f"and has received ₹{(r['total_amount_received'] or 0):,.2f} "
            f"in recorded expenditure transactions."
        )

        supporting_value = r["total_works"]
        threshold = 50

    else:
        reason = (
            f"Vendor has received ₹{(r['total_amount_received'] or 0):,.2f} "
            f"across {r['total_works']} works."
        )

        supporting_value = r["total_amount_received"]
        threshold = 10000000

    insert_signal(
        signal_type="VENDOR_CONCENTRATION",
        entity_type="VENDOR",
        entity_id=r["vendor_name"],
        mp_name=None,
        state=None,
        constituency=None,
        severity="INFO",
        reason=reason,
        supporting_value=supporting_value,
        threshold_value=threshold
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# 9. MP WITH PARTIALLY COMPLETED WORKS
# ==============================================================

print("\n[9/9] Building MP_PARTIAL_WORKS signals...")

rows = cur.execute("""
SELECT
    mp_id,
    mp_name,
    state,
    constituency,
    partially_completed_works
FROM monitoring_mp
WHERE partially_completed_works > 0
""").fetchall()

for r in rows:

    reason = (
        f"MP has {r['partially_completed_works']} "
        f"work(s) currently marked 'Work partially Completed' "
        f"in the source-reported work status."
    )

    insert_signal(
        signal_type="MP_PARTIAL_WORKS",
        entity_type="MP",
        entity_id=r["mp_id"],
        mp_name=r["mp_name"],
        state=r["state"],
        constituency=r["constituency"],
        severity="INFO",
        reason=reason,
        supporting_value=r["partially_completed_works"],
        threshold_value=1
    )

print(f"   Created {len(rows):,} signals.")


# ==============================================================
# COMMIT
# ==============================================================

conn.commit()


# ==============================================================
# VALIDATION
# ==============================================================

print("\n" + "=" * 70)
print("AI SIGNAL VALIDATION")
print("=" * 70)

total_signals = cur.execute("""
SELECT COUNT(*)
FROM ai_signal
""").fetchone()[0]

print(f"\nTotal AI signals: {total_signals:,}")


print("\n---------- SIGNAL TYPE COUNTS ----------")

rows = cur.execute("""
SELECT
    signal_type,
    COUNT(*) AS signal_count
FROM ai_signal
GROUP BY signal_type
ORDER BY signal_count DESC
""").fetchall()

for r in rows:
    print(
        f"{r['signal_type']:<40}: "
        f"{r['signal_count']:,}"
    )


print("\n---------- SEVERITY COUNTS ----------")

rows = cur.execute("""
SELECT
    severity,
    COUNT(*) AS signal_count
FROM ai_signal
GROUP BY severity
ORDER BY
    CASE severity
        WHEN 'REVIEW' THEN 1
        WHEN 'INFO' THEN 2
        ELSE 3
    END
""").fetchall()

for r in rows:
    print(
        f"{r['severity']:<10}: "
        f"{r['signal_count']:,}"
    )


# ==============================================================
# DATA QUALITY CHECKS
# ==============================================================

print("\n---------- DATA QUALITY CHECKS ----------")

null_reason = cur.execute("""
SELECT COUNT(*)
FROM ai_signal
WHERE reason IS NULL
   OR TRIM(reason) = ''
""").fetchone()[0]

null_entity = cur.execute("""
SELECT COUNT(*)
FROM ai_signal
WHERE entity_id IS NULL
   OR TRIM(entity_id) = ''
""").fetchone()[0]

print(
    f"Signals with missing reason : {null_reason}"
)

print(
    f"Signals with missing entity : {null_entity}"
)


# ==============================================================
# FINANCIAL SAFETY CHECK
# ==============================================================

print("\n---------- FINANCIAL SAFETY CHECK ----------")

exceed_count = cur.execute("""
SELECT COUNT(*)
FROM ai_signal
WHERE signal_type = 'HIGH_EXPENDITURE_RATIO'
  AND supporting_value > 100
""").fetchone()[0]

actual_exceed = cur.execute("""
SELECT COUNT(*)
FROM monitoring_work
WHERE expenditure_exceeds_sanction = 1
""").fetchone()[0]

print(
    f"Works with expenditure > sanction : {actual_exceed}"
)

print(
    f"High-ratio signals above 100%      : {exceed_count}"
)


# ==============================================================
# SAMPLE SIGNALS
# ==============================================================

print("\n---------- SAMPLE AI SIGNALS ----------")

rows = cur.execute("""
SELECT
    signal_type,
    entity_type,
    entity_id,
    severity,
    reason
FROM ai_signal
ORDER BY signal_id
LIMIT 10
""").fetchall()

for i, r in enumerate(rows, 1):

    print(f"\n{i}. {r['signal_type']}")
    print(f"   Entity   : {r['entity_type']} / {r['entity_id']}")
    print(f"   Severity : {r['severity']}")
    print(f"   Reason   : {r['reason']}")


# ==============================================================
# FINAL CHECK
# ==============================================================

print("\n" + "=" * 70)

if null_reason == 0 and null_entity == 0:
    print("AI SIGNAL LAYER CREATED SUCCESSFULLY ✓")
else:
    print("WARNING: DATA QUALITY ISSUES FOUND")

print("=" * 70)

print("\nCreated table:")
print("  ✓ ai_signal")

print("\nDatabase:")
print(DB_PATH)

print("\nDONE.")

conn.close()