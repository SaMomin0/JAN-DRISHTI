"""
AI Anomaly Signals Engine.
Consolidates and executes the 9 domain-specific signal rules from 22_build_ai_signals.py.
Computes real data-driven signals without hardcoded paths or dummy placeholders.
"""

import sqlite3
from typing import Dict, Any

def generate_ai_signals(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Generate and persist AI anomaly signals into the `ai_signal` table.
    Matches exact domain rules from 22_build_ai_signals.py.
    """
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 1. Ensure clean ai_signal table
    cur.execute("DROP TABLE IF EXISTS ai_signal;")
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
        created_at TEXT NOT NULL
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sig_type ON ai_signal(signal_type);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sig_sev ON ai_signal(severity);")
    
    def insert_signal(signal_type, entity_type, entity_id, mp_name, state, constituency, severity, reason, supporting_value=None, threshold_value=None):
        cur.execute("""
        INSERT INTO ai_signal (
            signal_type, entity_type, entity_id, mp_name, state, constituency,
            severity, reason, supporting_value, threshold_value, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            signal_type, entity_type, str(entity_id), mp_name, state, constituency,
            severity, reason, supporting_value, threshold_value
        ))

    # RULE 1: NO EXPENDITURE
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, sanction_amount, work_status
    FROM monitoring_work
    WHERE no_expenditure_record = 1;
    """).fetchall()
    for r in rows:
        reason = (
            f"No expenditure transaction is present for this work. "
            f"Sanction amount is ₹{(r['sanction_amount'] or 0):,.2f}. "
            f"Current source-reported status: {r['work_status']}."
        )
        insert_signal("NO_EXPENDITURE", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "INFO", reason, 0, 0)

    # RULE 2: EXPENDITURE WITHOUT COMPLETION
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, total_expenditure, sanction_amount, expenditure_transaction_count
    FROM monitoring_work
    WHERE expenditure_without_completion_record = 1;
    """).fetchall()
    for r in rows:
        ratio = (r["total_expenditure"] / r["sanction_amount"] * 100) if r["sanction_amount"] and r["sanction_amount"] > 0 else None
        reason = (
            f"Expenditure of ₹{(r['total_expenditure'] or 0):,.2f} "
            f"has been recorded across {r['expenditure_transaction_count']} transaction(s), "
            f"but no completion record is present in the completion dataset."
        )
        insert_signal("EXPENDITURE_WITHOUT_COMPLETION", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "REVIEW", reason, ratio, 100)

    # RULE 3: PAYMENT IN PROGRESS
    rows = cur.execute("""
    SELECT e.work_id, w.mp_name, w.state, w.constituency, COUNT(*) AS transaction_count, SUM(e.fund_disbursed_amount) AS total_amount
    FROM expenditure_transaction e
    JOIN work w ON e.work_id = w.work_id
    WHERE LOWER(TRIM(e.payment_status)) = 'payment in-progress'
    GROUP BY e.work_id, w.mp_name, w.state, w.constituency;
    """).fetchall()
    for r in rows:
        reason = f"This work has {r['transaction_count']} payment transaction(s) with Payment In-Progress status, totalling ₹{(r['total_amount'] or 0):,.2f}."
        insert_signal("PAYMENT_IN_PROGRESS", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "REVIEW", reason, r["total_amount"], 0)

    # RULE 4: MULTIPLE TRANSACTIONS
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, expenditure_transaction_count, total_expenditure
    FROM monitoring_work
    WHERE expenditure_transaction_count > 1;
    """).fetchall()
    for r in rows:
        reason = f"This work has {r['expenditure_transaction_count']} expenditure transactions totalling ₹{(r['total_expenditure'] or 0):,.2f}."
        insert_signal("MULTIPLE_TRANSACTIONS", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "INFO", reason, r["expenditure_transaction_count"], 1)

    # RULE 5: HIGH EXPENDITURE RATIO
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, total_expenditure, sanction_amount, expenditure_vs_sanction_percent
    FROM monitoring_work
    WHERE expenditure_vs_sanction_percent >= 90 AND sanction_amount > 0;
    """).fetchall()
    for r in rows:
        ratio = r["expenditure_vs_sanction_percent"]
        reason = f"Recorded expenditure is {ratio:.2f}% of the sanctioned amount. Expenditure: ₹{(r['total_expenditure'] or 0):,.2f}; Sanction: ₹{(r['sanction_amount'] or 0):,.2f}."
        insert_signal("HIGH_EXPENDITURE_RATIO", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "INFO", reason, ratio, 90)

    # RULE 6: LONG SANCTION TO FIRST EXPENDITURE
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, days_sanction_to_first_expenditure
    FROM monitoring_work
    WHERE days_sanction_to_first_expenditure >= 180;
    """).fetchall()
    for r in rows:
        days = r["days_sanction_to_first_expenditure"]
        reason = f"{days} days elapsed between the sanction date and the first recorded expenditure transaction."
        insert_signal("LONG_SANCTION_TO_EXPENDITURE", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "REVIEW", reason, days, 180)

    # RULE 7: LONG SANCTION TO COMPLETION
    rows = cur.execute("""
    SELECT work_id, mp_name, state, constituency, days_sanction_to_completion
    FROM monitoring_work
    WHERE days_sanction_to_completion >= 365;
    """).fetchall()
    for r in rows:
        days = r["days_sanction_to_completion"]
        reason = f"{days} days elapsed between the sanction date and the recorded completion date."
        insert_signal("LONG_SANCTION_TO_COMPLETION", "WORK", r["work_id"], r["mp_name"], r["state"], r["constituency"], "INFO", reason, days, 365)

    # RULE 8: VENDOR CONCENTRATION
    rows = cur.execute("""
    SELECT vendor_name, total_works, total_amount_received
    FROM monitoring_vendor
    WHERE total_works >= 50 OR total_amount_received >= 10000000
    ORDER BY total_amount_received DESC;
    """).fetchall()
    for r in rows:
        if r["total_works"] >= 50:
            reason = f"Vendor is associated with {r['total_works']} works and has received ₹{(r['total_amount_received'] or 0):,.2f} in recorded expenditure transactions."
            sup_val, thresh = r["total_works"], 50
        else:
            reason = f"Vendor has received ₹{(r['total_amount_received'] or 0):,.2f} across {r['total_works']} works."
            sup_val, thresh = r["total_amount_received"], 10000000
        insert_signal("VENDOR_CONCENTRATION", "VENDOR", r["vendor_name"], None, None, None, "INFO", reason, sup_val, thresh)

    # RULE 9: MP WITH PARTIAL WORKS
    rows = cur.execute("""
    SELECT mp_id, mp_name, state, constituency, partially_completed_works
    FROM monitoring_mp
    WHERE partially_completed_works > 0;
    """).fetchall()
    for r in rows:
        reason = f"MP has {r['partially_completed_works']} work(s) currently marked 'Work partially Completed' in the source-reported work status."
        insert_signal("MP_PARTIAL_WORKS", "MP", r["mp_id"], r["mp_name"], r["state"], r["constituency"], "INFO", reason, r["partially_completed_works"], 1)

    conn.commit()
    
    cur.execute("SELECT signal_type, COUNT(*), severity FROM ai_signal GROUP BY signal_type, severity;")
    summary_rows = cur.fetchall()
    counts = [{"signal_type": r[0], "count": r[1], "severity": r[2]} for r in summary_rows]
    
    cur.execute("SELECT COUNT(*) FROM ai_signal;")
    total_signals = cur.fetchone()[0]
    
    return {
        "total_signals": total_signals,
        "signals_by_type": counts
    }
