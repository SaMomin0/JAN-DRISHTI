"""
Expenditure and Payment Detector for MPLADS Phase 2.
Analyzes expenditure transactions, expenditure-to-sanction ratios, payment in-progress statuses,
multi-tranche payments, and vendor concentration anomalies.
"""

import sqlite3
from typing import List
from .base import BaseDetector, AnomalyResult

class ExpenditureDetector(BaseDetector):
    """
    Detects financial disbursement anomalies including expenditure exceeding sanction,
    high ratio discursions, payment in-progress status, and high vendor concentration.
    """

    def __init__(self, version: str = "1.0.0"):
        super().__init__(name="ExpenditureDetector", version=version)

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        anomalies: List[AnomalyResult] = []

        # 1. Expenditure Exceeding Sanction Amount
        query_exceed = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.sanction_amount,
            COALESCE(e.total_expenditure, 0) AS total_expenditure,
            e.transaction_count
        FROM work w
        INNER JOIN (
            SELECT work_id, SUM(fund_disbursed_amount) AS total_expenditure, COUNT(*) AS transaction_count
            FROM expenditure_transaction
            GROUP BY work_id
        ) e ON w.work_id = e.work_id
        WHERE w.sanction_amount IS NOT NULL
          AND w.sanction_amount > 0
          AND e.total_expenditure > w.sanction_amount;
        """
        rows = cur.execute(query_exceed).fetchall()
        for r in rows:
            diff = r["total_expenditure"] - r["sanction_amount"]
            ratio = (r["total_expenditure"] / r["sanction_amount"]) * 100.0
            score = min(round(ratio, 1), 100.0)
            severity = "CRITICAL" if ratio >= 125 else "HIGH"

            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="EXPENDITURE_EXCEEDS_SANCTION",
                score=score,
                severity=severity,
                confidence=0.95,
                reason=(
                    f"Recorded expenditure (₹{r['total_expenditure']:,.2f}) exceeds "
                    f"sanctioned amount (₹{r['sanction_amount']:,.2f}) by ₹{diff:,.2f} ({ratio:.1f}%)."
                ),
                evidence={
                    "source_dataset": "expenditure_transaction",
                    "observed_value": r["total_expenditure"],
                    "comparison_value": r["sanction_amount"],
                    "difference_value": diff,
                    "expenditure_ratio_percent": round(ratio, 2),
                    "transaction_count": r["transaction_count"]
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                comparison_statistics={"threshold": 100.0},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 2. High Expenditure Ratio (90% to 100%)
        query_high_ratio = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.sanction_amount,
            e.total_expenditure
        FROM work w
        INNER JOIN (
            SELECT work_id, SUM(fund_disbursed_amount) AS total_expenditure
            FROM expenditure_transaction
            GROUP BY work_id
        ) e ON w.work_id = e.work_id
        WHERE w.sanction_amount > 0
          AND (e.total_expenditure / w.sanction_amount) >= 0.90
          AND (e.total_expenditure / w.sanction_amount) <= 1.0;
        """
        rows = cur.execute(query_high_ratio).fetchall()
        for r in rows:
            ratio = (r["total_expenditure"] / r["sanction_amount"]) * 100.0
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="HIGH_EXPENDITURE_RATIO",
                score=round(ratio, 1),
                severity="INFO",
                confidence=0.90,
                reason=(
                    f"Recorded expenditure is {ratio:.1f}% of sanctioned amount "
                    f"(Expenditure: ₹{r['total_expenditure']:,.2f}; Sanction: ₹{r['sanction_amount']:,.2f})."
                ),
                evidence={
                    "source_dataset": "expenditure_transaction",
                    "observed_value": r["total_expenditure"],
                    "comparison_value": r["sanction_amount"],
                    "difference_value": r["sanction_amount"] - r["total_expenditure"],
                    "expenditure_ratio_percent": round(ratio, 2)
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                comparison_statistics={"threshold": 90.0},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 3. Payment In-Progress Transactions
        query_in_progress = """
        SELECT
            e.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            COUNT(*) AS transaction_count,
            SUM(e.fund_disbursed_amount) AS total_amount
        FROM expenditure_transaction e
        JOIN work w ON e.work_id = w.work_id
        WHERE LOWER(TRIM(e.payment_status)) = 'payment in-progress'
        GROUP BY e.work_id, w.mp_name, w.state, w.constituency;
        """
        rows = cur.execute(query_in_progress).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="PAYMENT_IN_PROGRESS",
                score=40.0,
                severity="MEDIUM",
                confidence=0.90,
                reason=(
                    f"Work has {r['transaction_count']} transaction(s) flagged 'Payment In-Progress' "
                    f"totalling ₹{r['total_amount']:,.2f}."
                ),
                evidence={
                    "source_dataset": "expenditure_transaction",
                    "observed_value": r["total_amount"],
                    "transaction_count": r["transaction_count"],
                    "payment_status": "Payment In-Progress"
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 4. Vendor Concentration (Vendor linked to works)
        query_vendor = """
        SELECT
            e.work_id,
            e.vendor_name,
            w.state,
            w.constituency,
            mv.total_works,
            mv.total_amount_received
        FROM expenditure_transaction e
        JOIN work w ON e.work_id = w.work_id
        JOIN (
            SELECT vendor_name, COUNT(DISTINCT work_id) AS total_works, SUM(fund_disbursed_amount) AS total_amount_received
            FROM expenditure_transaction
            WHERE vendor_name IS NOT NULL AND TRIM(vendor_name) != ''
            GROUP BY vendor_name
            HAVING COUNT(DISTINCT work_id) >= 50 OR SUM(fund_disbursed_amount) >= 10000000
        ) mv ON e.vendor_name = mv.vendor_name
        GROUP BY e.work_id;
        """
        rows = cur.execute(query_vendor).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="VENDOR_CONCENTRATION",
                score=50.0,
                severity="MEDIUM",
                confidence=0.85,
                reason=(
                    f"Vendor '{r['vendor_name']}' is associated with high volume across the platform "
                    f"({r['total_works']} works, ₹{r['total_amount_received']:,.2f} total disbursed)."
                ),
                evidence={
                    "source_dataset": "expenditure_transaction",
                    "vendor_name": r["vendor_name"],
                    "vendor_total_works": r["total_works"],
                    "vendor_total_disbursed": r["total_amount_received"]
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                comparison_statistics={"work_threshold": 50, "amount_threshold": 10000000},
                detector_name=self.name,
                detector_version=self.version
            ))

        return anomalies
