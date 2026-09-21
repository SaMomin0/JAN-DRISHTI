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
print("MPLADS MONITORING INDICATOR BUILDER")
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
# 4. REMOVE OLD MONITORING VIEWS
# ============================================================

print("\nRemoving old monitoring views...")

monitoring_views = [
    "monitoring_work",
    "monitoring_mp",
    "monitoring_vendor",
    "monitoring_payment",
    "monitoring_state",
    "monitoring_constituency"
]

for view in monitoring_views:

    cursor.execute(
        f"DROP VIEW IF EXISTS {view}"
    )


# ============================================================
# 5. WORK-LEVEL MONITORING
# ============================================================

print("Creating: monitoring_work")

cursor.execute("""
CREATE VIEW monitoring_work AS

SELECT

    w.work_id,

    w.mp_id,

    w.mp_name,

    w.state,

    w.constituency,

    w.work,

    w.work_category,

    w.work_description,

    w.recommended_date,

    w.sanction_date,

    w.sanction_amount,

    w.work_status,


    -- ======================================================
    -- EXPENDITURE
    -- ======================================================

    COALESCE(
        e.transaction_count,
        0
    ) AS expenditure_transaction_count,

    COALESCE(
        e.total_expenditure,
        0
    ) AS total_expenditure,

    e.first_expenditure_date,

    e.latest_expenditure_date,


    -- ======================================================
    -- COMPLETION
    -- ======================================================

    CASE

        WHEN c.work_id IS NOT NULL
        THEN 1

        ELSE 0

    END AS has_completion_record,

    c.completion_date,

    c.amount_disbursed
        AS completion_amount_disbursed,


    -- ======================================================
    -- EXPENDITURE VS SANCTION
    -- ======================================================

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

    END AS expenditure_vs_sanction_percent,


    -- ======================================================
    -- REMAINING SANCTIONED AMOUNT
    -- ======================================================

    CASE

        WHEN w.sanction_amount IS NULL
        THEN NULL

        ELSE

            w.sanction_amount
            -
            COALESCE(
                e.total_expenditure,
                0
            )

    END AS remaining_sanction_amount,


    -- ======================================================
    -- BASIC MONITORING FLAGS
    -- ======================================================

    CASE

        WHEN
            w.sanction_amount IS NOT NULL
            AND
            COALESCE(
                e.total_expenditure,
                0
            ) > w.sanction_amount

        THEN 1

        ELSE 0

    END AS expenditure_exceeds_sanction,


    CASE

        WHEN
            COALESCE(
                e.transaction_count,
                0
            ) = 0

        THEN 1

        ELSE 0

    END AS no_expenditure_record,


    CASE

        WHEN
            COALESCE(
                e.transaction_count,
                0
            ) > 0
            AND
            c.work_id IS NULL

        THEN 1

        ELSE 0

    END AS expenditure_without_completion_record,


    CASE

        WHEN
            w.work_status =
                'Work partially Completed'

        THEN 1

        ELSE 0

    END AS partially_completed_status,


    CASE

        WHEN
            w.work_status =
                'Work Completed'

        THEN 1

        ELSE 0

    END AS completed_status,


    CASE

        WHEN
            w.work_status =
                'Physical Inspection'

        THEN 1

        ELSE 0

    END AS physical_inspection_status,


    CASE

        WHEN
            w.work_status =
                'Vendor Identification'

        THEN 1

        ELSE 0

    END AS vendor_identification_status,


    CASE

        WHEN
            w.work_status =
                'Sanction'

        THEN 1

        ELSE 0

    END AS sanction_status,


    CASE

        WHEN
            w.work_status =
                'Time Estimation'

        THEN 1

        ELSE 0

    END AS time_estimation_status,


    -- ======================================================
    -- TIME INDICATORS
    -- ======================================================

    CASE

        WHEN
            w.sanction_date IS NOT NULL
            AND
            e.first_expenditure_date IS NOT NULL

        THEN

            CAST(
                julianday(
                    e.first_expenditure_date
                )
                -
                julianday(
                    w.sanction_date
                )
                AS INTEGER
            )

        ELSE NULL

    END AS days_sanction_to_first_expenditure,


    CASE

        WHEN
            w.sanction_date IS NOT NULL
            AND
            c.completion_date IS NOT NULL

        THEN

            CAST(
                julianday(
                    c.completion_date
                )
                -
                julianday(
                    w.sanction_date
                )
                AS INTEGER
            )

        ELSE NULL

    END AS days_sanction_to_completion,


    CASE

        WHEN
            e.first_expenditure_date IS NOT NULL
            AND
            c.completion_date IS NOT NULL

        THEN

            CAST(
                julianday(
                    c.completion_date
                )
                -
                julianday(
                    e.first_expenditure_date
                )
                AS INTEGER
            )

        ELSE NULL

    END AS days_first_expenditure_to_completion


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
# 6. MP-LEVEL MONITORING
# ============================================================

print("Creating: monitoring_mp")

cursor.execute("""
CREATE VIEW monitoring_mp AS

SELECT

    m.mp_id,

    m.mp_key,

    m.mp_name,

    m.state,

    m.constituency,

    m.allocated_amount,


    -- ======================================================
    -- WORK COUNTS
    -- ======================================================

    COUNT(
        w.work_id
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


    SUM(
        CASE

            WHEN w.work_status =
                'Physical Inspection'

            THEN 1

            ELSE 0

        END
    ) AS physical_inspection_works,


    SUM(
        CASE

            WHEN w.work_status =
                'Vendor Identification'

            THEN 1

            ELSE 0

        END
    ) AS vendor_identification_works,


    SUM(
        CASE

            WHEN w.work_status =
                'Sanction'

            THEN 1

            ELSE 0

        END
    ) AS sanction_works,


    SUM(
        CASE

            WHEN w.work_status =
                'Time Estimation'

            THEN 1

            ELSE 0

        END
    ) AS time_estimation_works,


    -- ======================================================
    -- FINANCIALS
    -- ======================================================

    COALESCE(
        (
            SELECT
                SUM(
                    w2.sanction_amount
                )

            FROM work w2

            WHERE
                w2.mp_id = m.mp_id
        ),
        0
    ) AS total_sanctioned_amount,


    COALESCE(
        (
            SELECT
                SUM(
                    e.fund_disbursed_amount
                )

            FROM work w3

            INNER JOIN expenditure_transaction e

                ON w3.work_id = e.work_id

            WHERE
                w3.mp_id = m.mp_id
        ),
        0
    ) AS total_expenditure,


    -- ======================================================
    -- COMPLETION
    -- ======================================================

    COALESCE(
        (
            SELECT
                COUNT(*)

            FROM completion c

            INNER JOIN work wc

                ON c.work_id = wc.work_id

            WHERE
                wc.mp_id = m.mp_id
        ),
        0
    ) AS completion_records,


    -- ======================================================
    -- CALAMITY
    -- ======================================================

    COALESCE(
        (
            SELECT
                COUNT(*)

            FROM calamity_consent cc

            WHERE
                cc.mp_id = m.mp_id
        ),
        0
    ) AS calamity_consent_records,


    COALESCE(
        (
            SELECT
                SUM(
                    cc.consent_amount
                )

            FROM calamity_consent cc

            WHERE
                cc.mp_id = m.mp_id
        ),
        0
    ) AS total_calamity_consent,


    -- ======================================================
    -- FLAGS
    -- ======================================================

    CASE

        WHEN
            m.allocated_amount IS NOT NULL
            AND
            (
                SELECT
                    COALESCE(
                        SUM(
                            e2.fund_disbursed_amount
                        ),
                        0
                    )

                FROM work w4

                INNER JOIN expenditure_transaction e2

                    ON w4.work_id = e2.work_id

                WHERE
                    w4.mp_id = m.mp_id
            )
            >
            m.allocated_amount

        THEN 1

        ELSE 0

    END AS expenditure_exceeds_allocation,


    CASE

        WHEN
            (
                SELECT
                    COUNT(*)

                FROM work w5

                WHERE
                    w5.mp_id = m.mp_id

                    AND
                    w5.work_status =
                        'Work partially Completed'
            ) > 0

        THEN 1

        ELSE 0

    END AS has_partially_completed_works


FROM mp m

LEFT JOIN work w

    ON m.mp_id = w.mp_id

GROUP BY

    m.mp_id,
    m.mp_key,
    m.mp_name,
    m.state,
    m.constituency,
    m.allocated_amount
""")


# ============================================================
# 7. VENDOR MONITORING
# ============================================================

print("Creating: monitoring_vendor")

cursor.execute("""
CREATE VIEW monitoring_vendor AS

SELECT

    vendor_name,

    COUNT(
        DISTINCT work_id
    ) AS total_works,

    COUNT(
        transaction_id
    ) AS total_transactions,

    SUM(
        fund_disbursed_amount
    ) AS total_amount_received,

    AVG(
        fund_disbursed_amount
    ) AS average_transaction_amount,

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
# 8. PAYMENT MONITORING
# ============================================================

print("Creating: monitoring_payment")

cursor.execute("""
CREATE VIEW monitoring_payment AS

SELECT

    payment_status,

    COUNT(
        transaction_id
    ) AS transaction_count,

    COUNT(
        DISTINCT work_id
    ) AS work_count,

    SUM(
        fund_disbursed_amount
    ) AS total_amount,

    AVG(
        fund_disbursed_amount
    ) AS average_transaction_amount

FROM expenditure_transaction

GROUP BY

    payment_status
""")


# ============================================================
# 9. STATE MONITORING
# ============================================================

print("Creating: monitoring_state")

cursor.execute("""
CREATE VIEW monitoring_state AS

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
        (
            SELECT
                SUM(
                    allocated_amount
                )

            FROM mp m2

            WHERE
                m2.state = m.state
        ),
        0
    ) AS total_allocated_amount,


    COALESCE(
        SUM(
            w.sanction_amount
        ),
        0
    ) AS total_sanctioned_amount,


    COALESCE(
        (
            SELECT
                SUM(
                    e.fund_disbursed_amount
                )

            FROM work ws

            INNER JOIN expenditure_transaction e

                ON ws.work_id = e.work_id

            WHERE
                ws.state = m.state
        ),
        0
    ) AS total_expenditure


FROM mp m

LEFT JOIN work w

    ON m.mp_id = w.mp_id

GROUP BY

    m.state
""")


# ============================================================
# 10. CONSTITUENCY MONITORING
# ============================================================

print("Creating: monitoring_constituency")

cursor.execute("""
CREATE VIEW monitoring_constituency AS

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
        (
            SELECT
                SUM(
                    allocated_amount
                )

            FROM mp m2

            WHERE
                m2.state = m.state

                AND
                m2.constituency =
                    m.constituency
        ),
        0
    ) AS total_allocated_amount,


    COALESCE(
        SUM(
            w.sanction_amount
        ),
        0
    ) AS total_sanctioned_amount,


    COALESCE(
        (
            SELECT
                SUM(
                    e.fund_disbursed_amount
                )

            FROM work wx

            INNER JOIN expenditure_transaction e

                ON wx.work_id = e.work_id

            WHERE
                wx.state = m.state

                AND
                wx.constituency =
                    m.constituency
        ),
        0
    ) AS total_expenditure


FROM mp m

LEFT JOIN work w

    ON m.mp_id = w.mp_id

GROUP BY

    m.state,
    m.constituency
""")


# ============================================================
# 11. COMMIT
# ============================================================

connection.commit()


# ============================================================
# 12. VALIDATE VIEWS
# ============================================================

print("\n" + "=" * 70)
print("MONITORING VIEW VALIDATION")
print("=" * 70)


for view in monitoring_views:

    try:

        count = cursor.execute(
            f"""
            SELECT COUNT(*)
            FROM {view}
            """
        ).fetchone()[0]

        print(
            f"{view:30} : {count:,} rows"
        )

    except Exception as error:

        print(
            f"{view:30} : ERROR"
        )

        print(error)


# ============================================================
# 13. WORK INDICATOR COUNTS
# ============================================================

print(
    "\n========== WORK MONITORING INDICATORS =========="
)


indicators = [

    (
        "Expenditure exceeds sanction",
        "expenditure_exceeds_sanction"
    ),

    (
        "No expenditure record",
        "no_expenditure_record"
    ),

    (
        "Expenditure without completion record",
        "expenditure_without_completion_record"
    ),

    (
        "Partially completed status",
        "partially_completed_status"
    ),

    (
        "Completed status",
        "completed_status"
    )

]


for label, column in indicators:

    count = cursor.execute(
        f"""
        SELECT COUNT(*)
        FROM monitoring_work
        WHERE {column} = 1
        """
    ).fetchone()[0]

    print(
        f"{label:45} : {count:,}"
    )


# ============================================================
# 14. MP INDICATOR COUNTS
# ============================================================

print(
    "\n========== MP MONITORING INDICATORS =========="
)


mp_exceeds = cursor.execute("""
SELECT COUNT(*)
FROM monitoring_mp
WHERE expenditure_exceeds_allocation = 1
""").fetchone()[0]


mp_partial = cursor.execute("""
SELECT COUNT(*)
FROM monitoring_mp
WHERE has_partially_completed_works = 1
""").fetchone()[0]


print(
    f"MPs with expenditure > allocation : "
    f"{mp_exceeds:,}"
)


print(
    f"MPs with partially completed works : "
    f"{mp_partial:,}"
)


# ============================================================
# 15. FINANCIAL CONSISTENCY
# ============================================================

print(
    "\n========== FINANCIAL CONSISTENCY =========="
)


transaction_total = cursor.execute("""
SELECT
    SUM(fund_disbursed_amount)

FROM expenditure_transaction
""").fetchone()[0]


mp_total = cursor.execute("""
SELECT
    SUM(total_expenditure)

FROM monitoring_mp
""").fetchone()[0]


print(
    f"Transaction expenditure : "
    f"₹{transaction_total:,.2f}"
)


print(
    f"MP monitoring total     : "
    f"₹{mp_total:,.2f}"
)


if abs(
    transaction_total - mp_total
) < 0.01:

    print(
        "MP expenditure aggregation: PASS ✓"
    )

else:

    print(
        "MP expenditure aggregation: FAIL ✗"
    )


# ============================================================
# 16. TOP MONITORING CASES
# ============================================================

print(
    "\n========== WORKS WITH EXPENDITURE > SANCTION =========="
)


rows = cursor.execute("""
SELECT

    work_id,

    mp_name,

    state,

    constituency,

    sanction_amount,

    total_expenditure,

    expenditure_vs_sanction_percent

FROM monitoring_work

WHERE
    expenditure_exceeds_sanction = 1

ORDER BY

    expenditure_vs_sanction_percent DESC

LIMIT 10
""").fetchall()


if rows:

    for row in rows:

        print(
            f"{row[0]} | "
            f"{row[1]} | "
            f"{row[2]} | "
            f"{row[3]} | "
            f"Sanction: ₹{row[4]:,.2f} | "
            f"Expenditure: ₹{row[5]:,.2f} | "
            f"{row[6]:.2f}%"
        )

else:

    print("No works found.")


# ============================================================
# 17. PAYMENT SUMMARY
# ============================================================

print(
    "\n========== PAYMENT SUMMARY =========="
)


rows = cursor.execute("""
SELECT

    payment_status,

    transaction_count,

    work_count,

    total_amount

FROM monitoring_payment

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
# 18. FINAL
# ============================================================

connection.close()


print(
    "\n" + "=" * 70
)

print(
    "MONITORING INDICATOR LAYER CREATED SUCCESSFULLY ✓"
)

print(
    "=" * 70
)


print("\nMonitoring views created:")

for view in monitoring_views:

    print(
        f"  ✓ {view}"
    )


print("\nDatabase:")

print(DB_FILE)

print("\nDONE.")