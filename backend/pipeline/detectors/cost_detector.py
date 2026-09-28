"""
Cost Anomaly Detector for MPLADS Phase 2.
Performs contextual cost analysis comparing works against peers in the same State, Constituency/District, and Work Category.
"""

import math
import sqlite3
from typing import List, Dict, Any
from .base import BaseDetector, AnomalyResult

class CostAnomalyDetector(BaseDetector):
    """
    Detects cost anomalies by contextual comparison within peer groups
    (State + Constituency + Work Category, or State + Work Category).
    """

    def __init__(self, version: str = "1.0.0"):
        super().__init__(name="CostAnomalyDetector", version=version)

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Compute group benchmarks directly via SQL for high performance
        cur.execute("""
        SELECT
            COALESCE(state, 'UnknownState') AS state,
            COALESCE(constituency, 'UnknownConstituency') AS constituency,
            COALESCE(work_category, 'General') AS work_category,
            COUNT(*) AS cnt,
            AVG(sanction_amount) AS avg_amt
        FROM work
        WHERE sanction_amount IS NOT NULL AND sanction_amount > 0
        GROUP BY state, constituency, work_category
        HAVING COUNT(*) >= 3;
        """)
        group_rows = cur.fetchall()

        benchmarks: Dict[str, Dict[str, float]] = {}
        for g in group_rows:
            key = f"{g['state']}|{g['constituency']}|{g['work_category']}"
            benchmarks[key] = {
                "count": float(g["cnt"]),
                "mean": round(float(g["avg_amt"]), 2)
            }

        # Fetch works and compare to benchmark
        query = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.work_category,
            w.sanction_amount,
            COALESCE(e.total_expenditure, 0) AS total_expenditure
        FROM work w
        LEFT JOIN (
            SELECT work_id, SUM(fund_disbursed_amount) AS total_expenditure
            FROM expenditure_transaction
            GROUP BY work_id
        ) e ON w.work_id = e.work_id
        WHERE w.sanction_amount IS NOT NULL AND w.sanction_amount > 0;
        """
        works = cur.execute(query).fetchall()

        anomalies: List[AnomalyResult] = []

        for w in works:
            cat = w["work_category"] or "General"
            state = w["state"] or "UnknownState"
            constituency = w["constituency"] or "UnknownConstituency"
            amount = float(w["sanction_amount"])

            key_fine = f"{state}|{constituency}|{cat}"
            bm = benchmarks.get(key_fine)

            if bm and bm["mean"] > 0:
                mean = bm["mean"]
                ratio = amount / mean
                if ratio >= 2.5:
                    score = min(round((ratio / 5.0) * 100.0, 1), 100.0)
                    severity = "CRITICAL" if ratio >= 4.0 else ("HIGH" if ratio >= 3.0 else "MEDIUM")
                    confidence = min(0.95, round(0.60 + (bm["count"] / 100.0) * 0.35, 2))

                    reason = (
                        f"Sanction amount of ₹{amount:,.2f} is significantly higher than peer average "
                        f"(₹{mean:,.2f}) in context '{state} / {constituency} / {cat}' "
                        f"({ratio:.1f}x group mean)."
                    )

                    evidence = {
                        "source_dataset": "work",
                        "source_record_id": w["work_id"],
                        "observed_value": amount,
                        "comparison_value": mean,
                        "difference_value": round(amount - mean, 2),
                        "ratio_to_mean": round(ratio, 2),
                        "expenditure_recorded": w["total_expenditure"]
                    }

                    comp_group = {
                        "state": state,
                        "constituency": constituency,
                        "work_category": cat
                    }

                    anomalies.append(AnomalyResult(
                        project_id=w["work_id"],
                        anomaly_type="COST_ANOMALY",
                        score=score,
                        severity=severity,
                        confidence=confidence,
                        reason=reason,
                        evidence=evidence,
                        comparison_group=comp_group,
                        comparison_statistics={"count": bm["count"], "mean": mean},
                        detector_name=self.name,
                        detector_version=self.version
                    ))

        return anomalies
