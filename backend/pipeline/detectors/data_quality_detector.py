"""
Data Quality Detector for MPLADS Phase 2.
Detects missing/invalid identifiers, missing/invalid amounts, chronological date logic violations,
and malformed geographic/status fields across all tables.
"""

import sqlite3
from typing import List
from .base import BaseDetector, AnomalyResult

class DataQualityDetector(BaseDetector):
    """
    Formal data-quality detector identifying data integrity issues including
    chronological date anomalies, invalid financial values, and missing mandatory fields.
    """

    def __init__(self, version: str = "1.0.0"):
        super().__init__(name="DataQualityDetector", version=version)

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        anomalies: List[AnomalyResult] = []

        # 1. Inconsistent Dates: Completion date prior to Sanction date
        query_date_order = """
        SELECT
            w.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            w.sanction_date,
            c.completion_date
        FROM work w
        INNER JOIN completion c ON w.work_id = c.work_id
        WHERE w.sanction_date IS NOT NULL
          AND c.completion_date IS NOT NULL
          AND JULIANDAY(c.completion_date) < JULIANDAY(w.sanction_date);
        """
        rows = cur.execute(query_date_order).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="INVALID_DATE_SEQUENCE",
                score=80.0,
                severity="HIGH",
                confidence=1.0,
                reason=(
                    f"Chronological anomaly: Completion date ({r['completion_date']}) "
                    f"is recorded before Sanction date ({r['sanction_date']})."
                ),
                evidence={
                    "source_dataset": "work / completion",
                    "sanction_date": r["sanction_date"],
                    "completion_date": r["completion_date"],
                    "issue": "completion_before_sanction"
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 2. Invalid Amounts: Negative or zero sanction amounts
        query_invalid_amount = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            work_status
        FROM work
        WHERE sanction_amount IS NULL OR sanction_amount <= 0;
        """
        rows = cur.execute(query_invalid_amount).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="INVALID_SANCTION_AMOUNT",
                score=50.0,
                severity="MEDIUM",
                confidence=0.95,
                reason=(
                    f"Sanction amount is missing or invalid (Value: {r['sanction_amount']}) "
                    f"for work in status '{r['work_status']}'."
                ),
                evidence={
                    "source_dataset": "work",
                    "observed_value": r["sanction_amount"],
                    "issue": "missing_or_non_positive_amount"
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        # 3. Missing Mandatory Identifiers / Geographic Context
        query_missing_geo = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency
        FROM work
        WHERE state IS NULL OR TRIM(state) = ''
           OR constituency IS NULL OR TRIM(constituency) = '';
        """
        rows = cur.execute(query_missing_geo).fetchall()
        for r in rows:
            anomalies.append(AnomalyResult(
                project_id=r["work_id"],
                anomaly_type="MISSING_GEOGRAPHIC_METADATA",
                score=40.0,
                severity="LOW",
                confidence=1.0,
                reason=f"Work record is missing mandatory State or Constituency metadata.",
                evidence={
                    "source_dataset": "work",
                    "state": r["state"],
                    "constituency": r["constituency"],
                    "issue": "missing_geo_fields"
                },
                comparison_group={"state": r["state"], "constituency": r["constituency"]},
                detector_name=self.name,
                detector_version=self.version
            ))

        return anomalies
