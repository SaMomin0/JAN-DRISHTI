"""
Analytics & Monitoring Indicators View Builder.
Consolidates views from 20_create_analytics_views.py and 21_build_monitoring_indicators.py.
Creates safe, validated SQL views on top of the master tables.
"""

import sqlite3
from typing import List, Tuple

VIEWS_DDL = [
    # 1. work_expenditure_summary
    """
    CREATE VIEW IF NOT EXISTS work_expenditure_summary AS
    SELECT
        w.work_id,
        COUNT(e.transaction_id) AS transaction_count,
        COALESCE(SUM(e.fund_disbursed_amount), 0) AS total_expenditure,
        MIN(e.expenditure_date) AS first_expenditure_date,
        MAX(e.expenditure_date) AS latest_expenditure_date
    FROM work w
    LEFT JOIN expenditure_transaction e ON w.work_id = e.work_id
    GROUP BY w.work_id;
    """,

    # 2. work_completion_summary
    """
    CREATE VIEW IF NOT EXISTS work_completion_summary AS
    SELECT
        w.work_id,
        CASE WHEN c.work_id IS NOT NULL THEN 1 ELSE 0 END AS has_completion_record,
        c.completion_date,
        c.amount_disbursed AS completion_amount_disbursed,
        c.image
    FROM work w
    LEFT JOIN completion c ON w.work_id = c.work_id;
    """,

    # 3. work_summary
    """
    CREATE VIEW IF NOT EXISTS work_summary AS
    SELECT
        w.work_id,
        w.work_category,
        w.work,
        w.state,
        w.ida,
        w.mp_name,
        w.constituency,
        w.work_description,
        w.recommended_date,
        w.sanction_date,
        w.sanction_amount,
        w.work_status,
        w.mp_id,
        e.transaction_count,
        e.total_expenditure,
        e.first_expenditure_date,
        e.latest_expenditure_date,
        c.has_completion_record,
        c.completion_date,
        c.completion_amount_disbursed,
        CASE 
            WHEN w.sanction_amount IS NULL OR w.sanction_amount = 0 THEN 0
            ELSE ROUND((COALESCE(e.total_expenditure, 0) / w.sanction_amount) * 100, 2)
        END AS expenditure_vs_sanction_percent,
        ROUND(COALESCE(w.sanction_amount, 0) - COALESCE(e.total_expenditure, 0), 2) AS remaining_sanction_amount
    FROM work w
    LEFT JOIN work_expenditure_summary e ON w.work_id = e.work_id
    LEFT JOIN work_completion_summary c ON w.work_id = c.work_id;
    """,

    # 4. mp_financial_summary
    """
    CREATE VIEW IF NOT EXISTS mp_financial_summary AS
    SELECT
        m.mp_id,
        m.mp_key,
        m.mp_name,
        m.state,
        m.constituency,
        m.allocated_amount,
        COALESCE(SUM(e.fund_disbursed_amount), 0) AS total_expenditure,
        COALESCE(m.allocated_amount, 0) - COALESCE(SUM(e.fund_disbursed_amount), 0) AS unspent_balance,
        CASE 
            WHEN m.allocated_amount IS NULL OR m.allocated_amount = 0 THEN 0
            ELSE ROUND((COALESCE(SUM(e.fund_disbursed_amount), 0) / m.allocated_amount) * 100, 2)
        END AS expenditure_percentage
    FROM mp m
    LEFT JOIN expenditure_transaction e ON m.mp_id = e.mp_id
    GROUP BY m.mp_id;
    """,

    # 5. mp_summary
    """
    CREATE VIEW IF NOT EXISTS mp_summary AS
    SELECT
        m.mp_id,
        m.mp_key,
        m.mp_name,
        m.state,
        m.constituency,
        m.allocated_amount,
        COUNT(DISTINCT w.work_id) AS total_works_sanctioned,
        COALESCE(SUM(w.sanction_amount), 0) AS total_sanction_amount,
        f.total_expenditure,
        f.unspent_balance,
        f.expenditure_percentage,
        COUNT(DISTINCT c.work_id) AS total_works_completed
    FROM mp m
    LEFT JOIN work w ON m.mp_id = w.mp_id
    LEFT JOIN mp_financial_summary f ON m.mp_id = f.mp_id
    LEFT JOIN completion c ON m.mp_id = c.mp_id
    GROUP BY m.mp_id;
    """,

    # 6. constituency_summary
    """
    CREATE VIEW IF NOT EXISTS constituency_summary AS
    SELECT
        w.state,
        w.constituency,
        COUNT(DISTINCT w.work_id) AS total_works,
        COALESCE(SUM(w.sanction_amount), 0) AS total_sanction_amount,
        COALESCE(SUM(e.fund_disbursed_amount), 0) AS total_expenditure,
        COUNT(DISTINCT c.work_id) AS total_completed_works
    FROM work w
    LEFT JOIN expenditure_transaction e ON w.work_id = e.work_id
    LEFT JOIN completion c ON w.work_id = c.work_id
    GROUP BY w.state, w.constituency;
    """,

    # 7. state_summary
    """
    CREATE VIEW IF NOT EXISTS state_summary AS
    SELECT
        w.state,
        COUNT(DISTINCT w.constituency) AS total_constituencies,
        COUNT(DISTINCT w.mp_id) AS total_mps,
        COUNT(DISTINCT w.work_id) AS total_works,
        COALESCE(SUM(w.sanction_amount), 0) AS total_sanction_amount,
        COALESCE(SUM(e.fund_disbursed_amount), 0) AS total_expenditure,
        COUNT(DISTINCT c.work_id) AS total_completed_works
    FROM work w
    LEFT JOIN expenditure_transaction e ON w.work_id = e.work_id
    LEFT JOIN completion c ON w.work_id = c.work_id
    GROUP BY w.state;
    """,

    # 8. vendor_summary
    """
    CREATE VIEW IF NOT EXISTS vendor_summary AS
    SELECT
        vendor_name,
        COUNT(DISTINCT work_id) AS distinct_works_count,
        COUNT(transaction_id) AS transaction_count,
        COALESCE(SUM(fund_disbursed_amount), 0) AS total_disbursed_amount,
        MIN(expenditure_date) AS first_transaction_date,
        MAX(expenditure_date) AS latest_transaction_date
    FROM expenditure_transaction
    WHERE vendor_name IS NOT NULL
    GROUP BY vendor_name;
    """,

    # 9. work_status_summary
    """
    CREATE VIEW IF NOT EXISTS work_status_summary AS
    SELECT
        work_status,
        COUNT(work_id) AS work_count,
        COALESCE(SUM(sanction_amount), 0) AS total_sanction_amount
    FROM work
    GROUP BY work_status;
    """,

    # 10. payment_status_summary
    """
    CREATE VIEW IF NOT EXISTS payment_status_summary AS
    SELECT
        payment_status,
        COUNT(transaction_id) AS transaction_count,
        COUNT(DISTINCT work_id) AS distinct_works_count,
        COALESCE(SUM(fund_disbursed_amount), 0) AS total_disbursed_amount
    FROM expenditure_transaction
    GROUP BY payment_status;
    """,

    # 11. calamity_summary
    """
    CREATE VIEW IF NOT EXISTS calamity_summary AS
    SELECT
        calamity_name,
        calamity_type,
        COUNT(consent_id) AS consent_records_count,
        COUNT(DISTINCT mp_id) AS mps_count,
        COALESCE(SUM(consent_amount), 0) AS total_consented_amount
    FROM calamity_consent
    GROUP BY calamity_name, calamity_type;
    """,

    # 12. monitoring_work
    """
    CREATE VIEW IF NOT EXISTS monitoring_work AS
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
        s.transaction_count AS expenditure_transaction_count,
        s.total_expenditure,
        s.first_expenditure_date,
        s.latest_expenditure_date,
        s.has_completion_record,
        s.completion_date,
        s.completion_amount_disbursed,
        s.expenditure_vs_sanction_percent,
        s.remaining_sanction_amount,
        CASE WHEN s.total_expenditure > w.sanction_amount THEN 1 ELSE 0 END AS expenditure_exceeds_sanction,
        CASE WHEN s.transaction_count = 0 THEN 1 ELSE 0 END AS no_expenditure_record,
        CASE WHEN s.transaction_count > 0 AND s.has_completion_record = 0 THEN 1 ELSE 0 END AS expenditure_without_completion_record,
        CASE WHEN w.work_status = 'Work partially Completed' THEN 1 ELSE 0 END AS is_partially_completed_work,
        CASE WHEN w.work_status = 'Physical Inspection' THEN 1 ELSE 0 END AS is_physical_inspection_work,
        ROUND(JULIANDAY(w.sanction_date) - JULIANDAY(w.recommended_date)) AS days_from_recommendation_to_sanction,
        ROUND(JULIANDAY(s.first_expenditure_date) - JULIANDAY(w.sanction_date)) AS days_from_sanction_to_first_expenditure,
        ROUND(JULIANDAY(s.completion_date) - JULIANDAY(w.sanction_date)) AS days_from_sanction_to_completion
    FROM work_summary s
    JOIN work w ON s.work_id = w.work_id;
    """,

    # 13. monitoring_mp
    """
    CREATE VIEW IF NOT EXISTS monitoring_mp AS
    SELECT
        m.mp_id,
        m.mp_name,
        m.state,
        m.constituency,
        m.allocated_amount,
        m.total_works_sanctioned,
        m.total_sanction_amount,
        m.total_expenditure,
        m.unspent_balance,
        m.expenditure_percentage,
        m.total_works_completed,
        CASE WHEN m.total_expenditure > m.allocated_amount THEN 1 ELSE 0 END AS expenditure_exceeds_allocation,
        SUM(CASE WHEN w.work_status = 'Work partially Completed' THEN 1 ELSE 0 END) AS partially_completed_works,
        SUM(CASE WHEN mw.no_expenditure_record = 1 THEN 1 ELSE 0 END) AS works_with_no_expenditure,
        SUM(CASE WHEN mw.expenditure_without_completion_record = 1 THEN 1 ELSE 0 END) AS works_with_exp_without_completion
    FROM mp_summary m
    LEFT JOIN work w ON m.mp_id = w.mp_id
    LEFT JOIN monitoring_work mw ON w.work_id = mw.work_id
    GROUP BY m.mp_id;
    """,

    # 14. monitoring_vendor
    """
    CREATE VIEW IF NOT EXISTS monitoring_vendor AS
    SELECT
        v.vendor_name,
        v.distinct_works_count,
        v.transaction_count,
        v.total_disbursed_amount,
        v.first_transaction_date,
        v.latest_transaction_date,
        ROUND(v.total_disbursed_amount / 282171701.0245, 4) AS share_of_national_expenditure_pct
    FROM vendor_summary v;
    """,

    # 15. monitoring_payment
    """
    CREATE VIEW IF NOT EXISTS monitoring_payment AS
    SELECT * FROM payment_status_summary;
    """,

    # 16. monitoring_state
    """
    CREATE VIEW IF NOT EXISTS monitoring_state AS
    SELECT
        s.*,
        ROUND(s.total_expenditure / 282171701.0245, 2) AS share_of_national_expenditure_pct
    FROM state_summary s;
    """,

    # 17. monitoring_constituency
    """
    CREATE VIEW IF NOT EXISTS monitoring_constituency AS
    SELECT * FROM constituency_summary;
    """
]

def build_views(conn: sqlite3.Connection):
    """Execute creation of all 17 analytics and monitoring views."""
    cur = conn.cursor()
    for sql in VIEWS_DDL:
        cur.execute(sql)
    conn.commit()
