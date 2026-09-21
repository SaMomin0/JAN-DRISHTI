import sqlite3
from pathlib import Path


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_DIR = BASE_DIR / "database"

DB_FILE = DATABASE_DIR / "mplads.db"


# ============================================================
# 2. CHECK DATABASE
# ============================================================

print("=" * 70)
print("MPLADS ANALYTICS LAYER BUILDER - SAFE AGGREGATION")
print("=" * 70)

if not DB_FILE.exists():

    print("\nERROR: Database not found:")
    print(DB_FILE)

    raise SystemExit(1)

print("\nDatabase found:")
print(DB_FILE)


# ============================================================
# 3. CONNECT
# ============================================================

connection = sqlite3.connect(DB_FILE)

cursor = connection.cursor()

print("\nConnected to database.")


# ============================================================
# 4. REMOVE OLD VIEWS
# ============================================================

print("\nRemoving old analytics views...")

views = [
    "mp_summary",
    "work_summary",
    "mp_financial_summary",
    "constituency_summary",
    "vendor_summary",
    "work_expenditure_summary",
    "work_completion_summary",
    "state_summary",
    "work_status_summary",
    "payment_status_summary",
    "calamity_summary"
]

for view in views:

    cursor.execute(
        f"DROP VIEW IF EXISTS {view}"
    )


# ============================================================
# 5. WORK SUMMARY
# ============================================================

print("Creating: work_summary")

cursor.execute("""
CREATE VIEW work_summary AS

SELECT

    w.work_id,

    w.work,

    w.work_category,

    w.state,

    w.ida,

    w.mp_id,

    w.mp_name,

    w.constituency,

    w.work_description,

    w.recommended_date,

    w.sanction_date,

    w.sanction_amount,

    w.work_status,

    COALESCE(e.transaction_count, 0)
        AS expenditure_transaction_count,

    COALESCE(e.total_expenditure, 0)
        AS total_expenditure,

    e.first_expenditure_date,

    e.latest_expenditure_date,

    CASE
        WHEN c.work_id IS NOT NULL
        THEN 1
        ELSE 0
    END AS has_completion_record,

    c.completion_date,

    c.amount_disbursed
        AS completion_amount_disbursed

FROM work w

LEFT JOIN (

    SELECT

        work_id,

        COUNT(*) AS transaction_count,

        SUM(
            fund_disbursed_amount
        ) AS total_expenditure,

        MIN(
            expenditure_date
        ) AS first_expenditure_date,

        MAX(
            expenditure_date
        ) AS latest_expenditure_date

    FROM expenditure_transaction

    GROUP BY work_id

) e

    ON w.work_id = e.work_id

LEFT JOIN completion c

    ON w.work_id = c.work_id
""")


# ============================================================
# 6. WORK EXPENDITURE SUMMARY
# ============================================================

print("Creating: work_expenditure_summary")

cursor.execute("""
CREATE VIEW work_expenditure_summary AS

SELECT

    w.work_id,

    w.mp_id,

    w.mp_name,

    w.state,

    w.constituency,

    w.work,

    w.work_category,

    w.sanction_amount,

    COALESCE(e.transaction_count, 0)
        AS transaction_count,

    COALESCE(e.total_expenditure, 0)
        AS total_expenditure,

    CASE

        WHEN w.sanction_amount IS NULL
        THEN NULL

        WHEN w.sanction_amount = 0
        THEN NULL

        ELSE

            (
                COALESCE(
                    e.total_expenditure,
                    0
                )
                /
                w.sanction_amount
            ) * 100

    END AS expenditure_vs_sanction_percent

FROM work w

LEFT JOIN (

    SELECT

        work_id,

        COUNT(*) AS transaction_count,

        SUM(
            fund_disbursed_amount
        ) AS total_expenditure

    FROM expenditure_transaction

    GROUP BY work_id

) e

    ON w.work_id = e.work_id
""")


# ============================================================
# 7. WORK COMPLETION SUMMARY
# ============================================================

print("Creating: work_completion_summary")

cursor.execute("""
CREATE VIEW work_completion_summary AS

SELECT

    w.work_id,

    w.mp_id,

    w.mp_name,

    w.state,

    w.constituency,

    w.work,

    w.work_category,

    w.sanction_amount,

    w.work_status,

    CASE

        WHEN c.work_id IS NOT NULL
        THEN 1

        ELSE 0

    END AS has_completion_record,

    c.completion_date,

    c.amount_disbursed
        AS completion_amount_disbursed,

    COALESCE(
        e.total_expenditure,
        0
    ) AS total_expenditure

FROM work w

LEFT JOIN completion c

    ON w.work_id = c.work_id

LEFT JOIN (

    SELECT

        work_id,

        SUM(
            fund_disbursed_amount
        ) AS total_expenditure

    FROM expenditure_transaction

    GROUP BY work_id

) e

    ON w.work_id = e.work_id
""")


# ============================================================
# 8. MP FINANCIAL SUMMARY
# ============================================================

print("Creating: mp_financial_summary")

cursor.execute("""
CREATE VIEW mp_financial_summary AS

SELECT

    m.mp_id,

    m.mp_key,

    m.mp_name,

    m.state,

    m.constituency,

    m.allocated_amount,

    COALESCE(
        w.total_sanctioned_amount,
        0
    ) AS total_sanctioned_amount,

    COALESCE(
        e.total_expenditure,
        0
    ) AS total_expenditure,

    (
        m.allocated_amount
        -
        COALESCE(
            e.total_expenditure,
            0
        )
    ) AS remaining_allocation,

    CASE

        WHEN m.allocated_amount IS NULL
        THEN NULL

        WHEN m.allocated_amount = 0
        THEN NULL

        ELSE

            (
                COALESCE(
                    e.total_expenditure,
                    0
                )
                /
                m.allocated_amount
            ) * 100

    END AS expenditure_vs_allocation_percent

FROM mp m

LEFT JOIN (

    SELECT

        mp_id,

        SUM(
            sanction_amount
        ) AS total_sanctioned_amount

    FROM work

    GROUP BY mp_id

) w

    ON m.mp_id = w.mp_id

LEFT JOIN (

    SELECT

        w.mp_id,

        SUM(
            e.fund_disbursed_amount
        ) AS total_expenditure

    FROM work w

    INNER JOIN expenditure_transaction e

        ON w.work_id = e.work_id

    GROUP BY w.mp_id

) e

    ON m.mp_id = e.mp_id
""")


# ============================================================
# 9. MP SUMMARY
# ============================================================

print("Creating: mp_summary")

cursor.execute("""
CREATE VIEW mp_summary AS

SELECT

    m.mp_id,

    m.mp_key,

    m.mp_name,

    m.state,

    m.constituency,

    m.allocated_amount,

    COALESCE(
        w.total_works,
        0
    ) AS total_works,

    COALESCE(
        w.completed_status_works,
        0
    ) AS completed_status_works,

    COALESCE(
        w.partially_completed_works,
        0
    ) AS partially_completed_works,

    COALESCE(
        w.physical_inspection_works,
        0
    ) AS physical_inspection_works,

    COALESCE(
        w.vendor_identification_works,
        0
    ) AS vendor_identification_works,

    COALESCE(
        w.sanction_works,
        0
    ) AS sanction_works,

    COALESCE(
        w.time_estimation_works,
        0
    ) AS time_estimation_works,

    COALESCE(
        w.completion_records,
        0
    ) AS completion_records,

    COALESCE(
        f.total_sanctioned_amount,
        0
    ) AS total_sanctioned_amount,

    COALESCE(
        f.total_expenditure,
        0
    ) AS total_expenditure,

    f.remaining_allocation,

    f.expenditure_vs_allocation_percent,

    COALESCE(
        c.calamity_consent_records,
        0
    ) AS calamity_consent_records,

    COALESCE(
        c.total_calamity_consent,
        0
    ) AS total_calamity_consent

FROM mp m

LEFT JOIN (

    SELECT

        mp_id,

        COUNT(*) AS total_works,

        SUM(
            CASE
                WHEN work_status = 'Work Completed'
                THEN 1
                ELSE 0
            END
        ) AS completed_status_works,

        SUM(
            CASE
                WHEN work_status =
                    'Work partially Completed'
                THEN 1
                ELSE 0
            END
        ) AS partially_completed_works,

        SUM(
            CASE
                WHEN work_status =
                    'Physical Inspection'
                THEN 1
                ELSE 0
            END
        ) AS physical_inspection_works,

        SUM(
            CASE
                WHEN work_status =
                    'Vendor Identification'
                THEN 1
                ELSE 0
            END
        ) AS vendor_identification_works,

        SUM(
            CASE
                WHEN work_status = 'Sanction'
                THEN 1
                ELSE 0
            END
        ) AS sanction_works,

        SUM(
            CASE
                WHEN work_status =
                    'Time Estimation'
                THEN 1
                ELSE 0
            END
        ) AS time_estimation_works,

        COUNT(
            CASE
                WHEN work_id IN (
                    SELECT work_id
                    FROM completion
                )
                THEN 1
            END
        ) AS completion_records

    FROM work

    GROUP BY mp_id

) w

    ON m.mp_id = w.mp_id

LEFT JOIN mp_financial_summary f

    ON m.mp_id = f.mp_id

LEFT JOIN (

    SELECT

        mp_id,

        COUNT(*) AS calamity_consent_records,

        SUM(
            consent_amount
        ) AS total_calamity_consent

    FROM calamity_consent

    GROUP BY mp_id

) c

    ON m.mp_id = c.mp_id
""")


# ============================================================
# 10. CONSTITUENCY SUMMARY
# ============================================================

print("Creating: constituency_summary")

cursor.execute("""
CREATE VIEW constituency_summary AS

SELECT

    m.state,

    m.constituency,

    COUNT(
        DISTINCT m.mp_id
    ) AS mp_count,

    COUNT(
        DISTINCT w.work_id
    ) AS total_works,

    SUM(
        CASE
            WHEN w.work_status =
                'Work Completed'
            THEN 1
            ELSE 0
        END
    ) AS completed_status_works,

    SUM(
        CASE
            WHEN w.work_status =
                'Work partially Completed'
            THEN 1
            ELSE 0
        END
    ) AS partially_completed_works,

    COALESCE(
        SUM(w.sanction_amount),
        0
    ) AS total_sanctioned_amount,

    COALESCE(
        e.total_expenditure,
        0
    ) AS total_expenditure,

    COALESCE(
        SUM(m.allocated_amount),
        0
    ) AS total_allocated_amount

FROM mp m

LEFT JOIN work w

    ON m.mp_id = w.mp_id

LEFT JOIN (

    SELECT

        w.state,

        w.constituency,

        SUM(
            e.fund_disbursed_amount
        ) AS total_expenditure

    FROM work w

    INNER JOIN expenditure_transaction e

        ON w.work_id = e.work_id

    GROUP BY

        w.state,
        w.constituency

) e

    ON m.state = e.state

    AND m.constituency =
        e.constituency

GROUP BY

    m.state,
    m.constituency
""")


# ============================================================
# 11. STATE SUMMARY
# ============================================================

print("Creating: state_summary")

cursor.execute("""
CREATE VIEW state_summary AS

SELECT

    m.state,

    COUNT(
        DISTINCT m.mp_id
    ) AS mp_count,

    COUNT(
        DISTINCT w.work_id
    ) AS total_works,

    SUM(
        CASE
            WHEN w.work_status =
                'Work Completed'
            THEN 1
            ELSE 0
        END
    ) AS completed_status_works,

    SUM(
        CASE
            WHEN w.work_status =
                'Work partially Completed'
            THEN 1
            ELSE 0
        END
    ) AS partially_completed_works,

    COALESCE(
        MAX(a.total_allocated_amount),
        0
    ) AS total_allocated_amount,

    COALESCE(
        SUM(w.sanction_amount),
        0
    ) AS total_sanctioned_amount,

    COALESCE(
        MAX(e.total_expenditure),
        0
    ) AS total_expenditure

FROM mp m

LEFT JOIN work w

    ON m.mp_id = w.mp_id

LEFT JOIN (

    SELECT

        state,

        SUM(
            allocated_amount
        ) AS total_allocated_amount

    FROM mp

    GROUP BY state

) a

    ON m.state = a.state

LEFT JOIN (

    SELECT

        wx.state,

        SUM(
            ex.fund_disbursed_amount
        ) AS total_expenditure

    FROM work wx

    INNER JOIN expenditure_transaction ex

        ON wx.work_id = ex.work_id

    GROUP BY wx.state

) e

    ON m.state = e.state

GROUP BY

    m.state
""")


# ============================================================
# 12. VENDOR SUMMARY
# ============================================================

print("Creating: vendor_summary")

cursor.execute("""
CREATE VIEW vendor_summary AS

SELECT

    vendor_name,

    COUNT(
        DISTINCT work_id
    ) AS total_works,

    COUNT(
        transaction_id
    ) AS total_transactions,

    COALESCE(
        SUM(
            fund_disbursed_amount
        ),
        0
    ) AS total_amount_received,

    MIN(
        expenditure_date
    ) AS first_payment_date,

    MAX(
        expenditure_date
    ) AS latest_payment_date

FROM expenditure_transaction

WHERE
    vendor_name IS NOT NULL

GROUP BY

    vendor_name
""")


# ============================================================
# 13. WORK STATUS SUMMARY
# ============================================================

print("Creating: work_status_summary")

cursor.execute("""
CREATE VIEW work_status_summary AS

SELECT

    work_status,

    COUNT(
        work_id
    ) AS work_count,

    COALESCE(
        SUM(
            sanction_amount
        ),
        0
    ) AS total_sanctioned_amount,

    COALESCE(
        SUM(
            total_expenditure
        ),
        0
    ) AS total_expenditure

FROM work_summary

GROUP BY

    work_status
""")


# ============================================================
# 14. PAYMENT STATUS SUMMARY
# ============================================================

print("Creating: payment_status_summary")

cursor.execute("""
CREATE VIEW payment_status_summary AS

SELECT

    payment_status,

    COUNT(
        transaction_id
    ) AS transaction_count,

    COUNT(
        DISTINCT work_id
    ) AS work_count,

    COALESCE(
        SUM(
            fund_disbursed_amount
        ),
        0
    ) AS total_amount

FROM expenditure_transaction

GROUP BY

    payment_status
""")


# ============================================================
# 15. CALAMITY SUMMARY
# ============================================================

print("Creating: calamity_summary")

cursor.execute("""
CREATE VIEW calamity_summary AS

SELECT

    calamity_type,

    calamity_name,

    COUNT(
        consent_id
    ) AS consent_records,

    COUNT(
        DISTINCT mp_id
    ) AS mp_count,

    COALESCE(
        SUM(consent_amount),
        0
    ) AS total_consent_amount,

    MIN(
        consent_date
    ) AS first_consent_date,

    MAX(
        consent_date
    ) AS latest_consent_date

FROM calamity_consent

GROUP BY

    calamity_type,

    calamity_name
""")


# ============================================================
# 16. COMMIT
# ============================================================

connection.commit()


# ============================================================
# 17. VALIDATE VIEWS
# ============================================================

print("\n" + "=" * 70)
print("ANALYTICS VIEW VALIDATION")
print("=" * 70)


for view in views:

    try:

        count = cursor.execute(
            f"""
            SELECT COUNT(*)
            FROM {view}
            """
        ).fetchone()[0]

        print(
            f"{view:35} : {count:,} rows"
        )

    except Exception as error:

        print(
            f"{view:35} : ERROR"
        )

        print(error)


# ============================================================
# 18. FINANCIAL CONSISTENCY CHECK
# ============================================================

print("\n" + "=" * 70)
print("FINANCIAL CONSISTENCY CHECK")
print("=" * 70)


database_expenditure = cursor.execute("""
SELECT
    SUM(fund_disbursed_amount)
FROM expenditure_transaction
""").fetchone()[0]


mp_summary_expenditure = cursor.execute("""
SELECT
    SUM(total_expenditure)
FROM mp_financial_summary
""").fetchone()[0]


print(
    f"Transaction table expenditure : "
    f"₹{database_expenditure:,.2f}"
)


print(
    f"MP financial summary total    : "
    f"₹{mp_summary_expenditure:,.2f}"
)


if abs(
    database_expenditure -
    mp_summary_expenditure
) < 0.01:

    print(
        "Expenditure aggregation check: PASS ✓"
    )

else:

    print(
        "Expenditure aggregation check: FAIL ✗"
    )


# ============================================================
# 19. SANCTION CONSISTENCY CHECK
# ============================================================

database_sanction = cursor.execute("""
SELECT
    SUM(sanction_amount)
FROM work
""").fetchone()[0]


mp_summary_sanction = cursor.execute("""
SELECT
    SUM(total_sanctioned_amount)
FROM mp_financial_summary
""").fetchone()[0]


print(
    f"\nWork table sanctioned total    : "
    f"₹{database_sanction:,.2f}"
)


print(
    f"MP summary sanctioned total    : "
    f"₹{mp_summary_sanction:,.2f}"
)


if abs(
    database_sanction -
    mp_summary_sanction
) < 0.01:

    print(
        "Sanction aggregation check: PASS ✓"
    )

else:

    print(
        "Sanction aggregation check: FAIL ✗"
    )


# ============================================================
# 20. SAMPLE ANALYTICS
# ============================================================

print("\n" + "=" * 70)
print("SAMPLE ANALYTICS")
print("=" * 70)


# Total works

total_works = cursor.execute("""
SELECT COUNT(*)
FROM work
""").fetchone()[0]


print(
    f"\nTotal works: {total_works:,}"
)


# Total expenditure transactions

total_transactions = cursor.execute("""
SELECT COUNT(*)
FROM expenditure_transaction
""").fetchone()[0]


print(
    f"Total expenditure transactions: "
    f"{total_transactions:,}"
)


# Total expenditure

print(
    f"Total expenditure: "
    f"₹{database_expenditure:,.2f}"
)


# Total allocation

total_allocation = cursor.execute("""
SELECT
    SUM(allocated_amount)
FROM mp
""").fetchone()[0]


print(
    f"Total allocation: "
    f"₹{total_allocation:,.2f}"
)


# ============================================================
# 21. TOP MPs BY EXPENDITURE
# ============================================================

print(
    "\n========== TOP 10 MPs BY EXPENDITURE =========="
)


rows = cursor.execute("""
SELECT

    mp_name,

    state,

    constituency,

    total_expenditure

FROM mp_financial_summary

ORDER BY

    total_expenditure DESC

LIMIT 10
""").fetchall()


for row in rows:

    print(
        f"{row[0]} | "
        f"{row[1]} | "
        f"{row[2]} | "
        f"₹{row[3]:,.2f}"
    )


# ============================================================
# 22. TOP VENDORS
# ============================================================

print(
    "\n========== TOP 10 VENDORS BY AMOUNT =========="
)


rows = cursor.execute("""
SELECT

    vendor_name,

    total_works,

    total_transactions,

    total_amount_received

FROM vendor_summary

ORDER BY

    total_amount_received DESC

LIMIT 10
""").fetchall()


for row in rows:

    print(
        f"{row[0]} | "
        f"Works: {row[1]:,} | "
        f"Transactions: {row[2]:,} | "
        f"₹{row[3]:,.2f}"
    )


# ============================================================
# 23. PAYMENT STATUS
# ============================================================

print(
    "\n========== PAYMENT STATUS =========="
)


rows = cursor.execute("""
SELECT

    payment_status,

    transaction_count,

    work_count,

    total_amount

FROM payment_status_summary

ORDER BY

    total_amount DESC
""").fetchall()


for row in rows:

    print(
        f"{row[0]} | "
        f"Transactions: {row[1]:,} | "
        f"Works: {row[2]:,} | "
        f"₹{row[3]:,.2f}"
    )


# ============================================================
# 24. FINAL
# ============================================================

connection.close()


print(
    "\n" + "=" * 70
)

print(
    "SAFE ANALYTICS LAYER CREATED SUCCESSFULLY ✓"
)

print(
    "=" * 70
)


print("\nViews created:")

for view in views:

    print(
        f"  ✓ {view}"
    )


print("\nDatabase:")

print(DB_FILE)


print("\nDONE.")