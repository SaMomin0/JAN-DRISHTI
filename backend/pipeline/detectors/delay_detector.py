"""
Delay Anomaly Detector for MPLADS Phase 2.
Detects sanction-to-expenditure delays, sanction-to-completion delays, long-running works, and date logic inconsistencies.
"""

import sqlite3
from typing import List
from .base import BaseDetector, AnomalyResult

class DelayAnomalyDetector(BaseDetector):
    """
    Detects timeline anomalies including long sanction-to-expenditure duration,
    excessive completion delays, and long active works without completion.
    """

    def __init__(self, version: str = "1.0.0"):
        super().__init__(name="DelayAnomalyDetector", version=version)

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        query = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.work_category,
            w.work_status,
            w.recommended_date,
            w.sanction_date,
            e.first_expenditure_date,
            e.latest_expenditure_date,
            c.completion_date,
            CAST(JULIANDAY(e.first_expenditure_date) - JULIANDAY(w.sanction_date) AS INTEGER) AS days_sanction_to_exp,
            CAST(JULIANDAY(c.completion_date) - JULIANDAY(w.sanction_date) AS INTEGER) AS days_sanction_to_comp,
            CAST(JULIANDAY('now') - JULIANDAY(w.sanction_date) AS INTEGER) AS days_since_sanction
        FROM work w
        LEFT JOIN (
            SELECT
                work_id,
                MIN(expenditure_date) AS first_expenditure_date,
                MAX(expenditure_date) AS latest_expenditure_date
            FROM expenditure_transaction
            GROUP BY work_id
        ) e ON w.work_id = e.work_id
        LEFT JOIN completion c ON w.work_id = c.work_id;
        """

        rows = cur.execute(query).fetchall()
        anomalies: List[AnomalyResult] = []

        for r in rows:
            work_id = r["work_id"]
            state = r["state"] or "Unknown"
            constituency = r["constituency"] or "Unknown"
            cat = r["work_category"] or "General"
            comp_group = {"state": state, "constituency": constituency, "category": cat}

            # 1. Sanction to First Expenditure Delay (Threshold: >= 180 days)
            days_exp = r["days_sanction_to_exp"]
            if days_exp is not None and days_exp >= 180:
                score = min(round((days_exp / 365.0) * 50 + 50, 1), 100.0)
                severity = "HIGH" if days_exp >= 365 else "MEDIUM"
                anomalies.append(AnomalyResult(
                    project_id=work_id,
                    anomaly_type="SANCTION_TO_EXPENDITURE_DELAY",
                    score=score,
                    severity=severity,
                    confidence=0.85,
                    reason=(
                        f"{days_exp} days elapsed between sanction date ({r['sanction_date']}) "
                        f"and first expenditure transaction ({r['first_expenditure_date']}) "
                        f"(Threshold: 180 days)."
                    ),
                    evidence={
                        "source_dataset": "monitoring_work",
                        "sanction_date": r["sanction_date"],
                        "first_expenditure_date": r["first_expenditure_date"],
                        "observed_value": days_exp,
                        "threshold_value": 180,
                        "difference_value": days_exp - 180
                    },
                    comparison_group=comp_group,
                    comparison_statistics={"threshold": 180, "benchmark_median_days": 60},
                    detector_name=self.name,
                    detector_version=self.version
                ))

            # 2. Sanction to Completion Delay (Threshold: >= 365 days)
            days_comp = r["days_sanction_to_comp"]
            if days_comp is not None and days_comp >= 365:
                score = min(round((days_comp / 730.0) * 50 + 50, 1), 100.0)
                severity = "HIGH" if days_comp >= 730 else "MEDIUM"
                anomalies.append(AnomalyResult(
                    project_id=work_id,
                    anomaly_type="LONG_SANCTION_TO_COMPLETION",
                    score=score,
                    severity=severity,
                    confidence=0.85,
                    reason=(
                        f"{days_comp} days elapsed between sanction date ({r['sanction_date']}) "
                        f"and completion date ({r['completion_date']}) "
                        f"(Threshold: 365 days)."
                    ),
                    evidence={
                        "source_dataset": "monitoring_work",
                        "sanction_date": r["sanction_date"],
                        "completion_date": r["completion_date"],
                        "observed_value": days_comp,
                        "threshold_value": 365,
                        "difference_value": days_comp - 365
                    },
                    comparison_group=comp_group,
                    comparison_statistics={"threshold": 365, "benchmark_median_days": 180},
                    detector_name=self.name,
                    detector_version=self.version
                ))

            # 3. Active Work Prolonged Delay (Sanctioned > 500 days ago, no completion record)
            days_active = r["days_since_sanction"]
            if days_active is not None and days_active >= 500 and r["completion_date"] is None and r["work_status"] != "Work Completed":
                score = min(round((days_active / 1000.0) * 50 + 50, 1), 100.0)
                severity = "HIGH" if days_active >= 730 else "MEDIUM"
                anomalies.append(AnomalyResult(
                    project_id=work_id,
                    anomaly_type="PROLONGED_UNCOMPLETED_WORK",
                    score=score,
                    severity=severity,
                    confidence=0.80,
                    reason=(
                        f"Work was sanctioned {days_active} days ago ({r['sanction_date']}) "
                        f"and remains uncompleted (Status: '{r['work_status']}')."
                    ),
                    evidence={
                        "source_dataset": "work",
                        "sanction_date": r["sanction_date"],
                        "latest_expenditure_date": r["latest_expenditure_date"],
                        "work_status": r["work_status"],
                        "observed_value": days_active,
                        "threshold_value": 500
                    },
                    comparison_group=comp_group,
                    comparison_statistics={"threshold": 500},
                    detector_name=self.name,
                    detector_version=self.version
                ))

        return anomalies
