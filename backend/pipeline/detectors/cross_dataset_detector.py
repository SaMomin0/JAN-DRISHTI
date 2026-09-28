"""
Cross-Dataset Inconsistency Detector for MPLADS Phase 2.
Translates reconciliation discrepancies across Works Recommended, Sanctioned, Expenditure,
Completion, and Calamity datasets into structured monitoring anomalies.
"""

import sqlite3
from typing import List
from .base import BaseDetector, AnomalyResult

class CrossDatasetDetector(BaseDetector):
    """
    Detects cross-dataset inconsistencies such as expenditure without completion records,
    no expenditure records for sanctioned works, and amount discrepancies across datasets.
    """

    def __init__(self, version: str = "1.0.0"):
        super().__init__(name="CrossDatasetDetector", version=version)

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        anomalies: List[AnomalyResult] = []

        # 1. Expenditure without completion record
        query_no_comp = """
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
        LEFT JOIN completion c ON w.work_id = c.work_id
        WHERE c.work_id IS NULL;
        """
        rows = cur.execute(query_no_comp).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="EXPENDITURE_WITHOUT_COMPLETION",
                score=60.0,
                severity="HIGH",
                confidence=0.90,
                reason=(
                    f"Expenditure of ₹{r['total_expenditure']:,.2f} recorded across "
                    f"{r['transaction_count']} transaction(s), but no completion record exists in completion dataset."
                ),
                evidence={
                    "source_dataset": "expenditure_transaction",
                    "missing_in_dataset": "completion",
                    "observed_value": r["total_expenditure"],
                    "transaction_count": r["transaction_count"],
                    "sanction_amount": r["sanction_amount"]
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 2. No expenditure record for sanctioned work
        query_no_exp = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.sanction_amount,
            w.work_status
        FROM work w
        LEFT JOIN expenditure_transaction e ON w.work_id = e.work_id
        WHERE e.work_id IS NULL
          AND w.sanction_amount IS NOT NULL
          AND w.sanction_amount > 0;
        """
        rows = cur.execute(query_no_exp).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="NO_EXPENDITURE_RECORD",
                score=35.0,
                severity="MEDIUM",
                confidence=0.95,
                reason=(
                    f"Sanctioned work (Sanction: ₹{r['sanction_amount']:,.2f}, Status: '{r['work_status']}') "
                    f"has zero expenditure transactions present in the expenditure dataset."
                ),
                evidence={
                    "source_dataset": "work",
                    "missing_in_dataset": "expenditure_transaction",
                    "sanction_amount": r["sanction_amount"],
                    "work_status": r["work_status"]
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 3. Discrepancy between Completion Disbursement and Expenditure total
        query_discrepancy = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.sanction_amount,
            e.total_expenditure,
            c.amount_disbursed AS completion_disbursed
        FROM work w
        INNER JOIN (
            SELECT work_id, SUM(fund_disbursed_amount) AS total_expenditure
            FROM expenditure_transaction
            GROUP BY work_id
        ) e ON w.work_id = e.work_id
        INNER JOIN completion c ON w.work_id = c.work_id
        WHERE c.amount_disbursed IS NOT NULL
          AND ABS(c.amount_disbursed - e.total_expenditure) > 100.0;
        """
        rows = cur.execute(query_discrepancy).fetchall()
        for r in rows:
            diff = r["completion_disbursed"] - r["total_expenditure"]
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="CROSS_DATASET_AMOUNT_MISMATCH",
                score=75.0,
                severity="HIGH",
                confidence=0.90,
                reason=(
                    f"Disbursement mismatch between completion record (₹{r['completion_disbursed']:,.2f}) "
                    f"and transaction expenditure sum (₹{r['total_expenditure']:,.2f}). Difference: ₹{abs(diff):,.2f}."
                ),
                evidence={
                    "source_dataset": "completion vs expenditure_transaction",
                    "completion_amount_disbursed": r["completion_disbursed"],
                    "total_expenditure_transactions": r["total_expenditure"],
                    "difference_value": round(diff, 2)
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        return anomalies
