"""
MPLADS Centralized Explainable AI Risk Engine (Phase 2).
Aggregates structured anomaly detector results into composite risk scores (0–100),
risk levels (LOW, MEDIUM, HIGH), factor breakdown scores, natural language evidence explanations,
and independent confidence metrics.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
import json
import sqlite3
from .detectors.base import AnomalyResult
from .detectors.cost_detector import CostAnomalyDetector
from .detectors.delay_detector import DelayAnomalyDetector
from .detectors.expenditure_detector import ExpenditureDetector
from .detectors.duplicate_detector import DuplicateWorkDetector
from .detectors.cross_dataset_detector import CrossDatasetDetector
from .detectors.data_quality_detector import DataQualityDetector

@dataclass
class RiskEngineConfig:
    """Configurable weights for the centralized risk engine."""
    weights: Dict[str, float] = field(default_factory=lambda: {
        "cost": 0.25,
        "delay": 0.20,
        "expenditure": 0.25,
        "cross_dataset": 0.15,
        "duplicate": 0.05,
        "data_quality": 0.10
    })

@dataclass
class ProjectRiskProfile:
    """Detailed risk profile for a single project (work_id)."""
    work_id: str
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH
    confidence: float  # 0.0 to 1.0
    factor_scores: Dict[str, float]
    explanations: List[str]
    anomalies: List[AnomalyResult]

class ExplainableRiskEngine:
    """
    Centralized risk engine that executes all detectors, applies configuration-driven
    weights, normalizes signals, generates natural language explanations, and computes confidence.
    """

    def __init__(self, config: Optional[RiskEngineConfig] = None):
        self.config = config or RiskEngineConfig()
        self.detectors = [
            CostAnomalyDetector(),
            DelayAnomalyDetector(),
            ExpenditureDetector(),
            DuplicateWorkDetector(),
            CrossDatasetDetector(),
            DataQualityDetector()
        ]

    def map_anomaly_to_factor(self, anomaly_type: str) -> str:
        """Map detector anomaly types to risk factors."""
        if "COST" in anomaly_type:
            return "cost"
        elif "DELAY" in anomaly_type or "PROLONGED" in anomaly_type:
            return "delay"
        elif "EXPENDITURE" in anomaly_type or "PAYMENT" in anomaly_type or "VENDOR" in anomaly_type:
            return "expenditure"
        elif "CROSS_DATASET" in anomaly_type or "NO_EXPENDITURE" in anomaly_type or "COMPLETION" in anomaly_type:
            return "cross_dataset"
        elif "DUPLICATE" in anomaly_type:
            return "duplicate"
        else:
            return "data_quality"

    def run_detection(self, conn: sqlite3.Connection) -> Dict[str, List[AnomalyResult]]:
        """Run all domain detectors and group anomalies by project_id."""
        project_anomalies: Dict[str, List[AnomalyResult]] = {}
        for detector in self.detectors:
            results = detector.detect(conn)
            for res in results:
                project_anomalies.setdefault(res.project_id, []).append(res)
        return project_anomalies

    def calculate_risk_profile(
        self,
        work_id: str,
        anomalies: List[AnomalyResult],
        work_record: Optional[Dict[str, Any]] = None
    ) -> ProjectRiskProfile:
        """Compute composite risk score, factor breakdown, explanations, and confidence for a work."""
        factor_max_scores: Dict[str, float] = {k: 0.0 for k in self.config.weights}
        factor_explanations: List[str] = []
        confidences: List[float] = []

        for anomaly in anomalies:
            factor = self.map_anomaly_to_factor(anomaly.anomaly_type)
            # Factor raw score is the maximum normalized score (0-100) seen for that factor
            factor_max_scores[factor] = max(factor_max_scores[factor], anomaly.score)
            factor_explanations.append(f"[{factor.upper()}] {anomaly.reason}")
            confidences.append(anomaly.confidence)

        # Composite weighted risk score (0–100)
        total_score = sum(
            factor_max_scores[f] * self.config.weights.get(f, 0.0)
            for f in factor_max_scores
        )
        risk_score = round(min(total_score, 100.0), 1)

        # Risk level classification
        if risk_score >= 65.0:
            risk_level = "HIGH"
        elif risk_score >= 30.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Independent confidence score calculation
        if confidences:
            avg_detector_conf = sum(confidences) / len(confidences)
            detector_agreement = min(1.0, 0.70 + (len(anomalies) * 0.05))
            confidence = round((avg_detector_conf * 0.6) + (detector_agreement * 0.4), 2)
        else:
            confidence = 0.90  # Default confidence for zero-anomaly baseline

        # Factor score contribution breakdown
        factor_contributions = {
            f: round(factor_max_scores[f] * self.config.weights.get(f, 0.0), 1)
            for f in factor_max_scores
        }

        return ProjectRiskProfile(
            work_id=work_id,
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            factor_scores=factor_contributions,
            explanations=factor_explanations,
            anomalies=anomalies
        )

    def evaluate_all_works(self, conn: sqlite3.Connection) -> List[ProjectRiskProfile]:
        """Evaluate risk profiles for all works present in the database."""
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        work_ids = [r[0] for r in cur.execute("SELECT work_id FROM work;").fetchall()]

        anomalies_by_work = self.run_detection(conn)
        profiles: List[ProjectRiskProfile] = []

        for wid in work_ids:
            anom_list = anomalies_by_work.get(wid, [])
            profile = self.calculate_risk_profile(wid, anom_list)
            profiles.append(profile)

        profiles.sort(key=lambda p: p.risk_score, reverse=True)
        return profiles


# Backward compatibility functions
def compute_work_risk_scores(conn: sqlite3.Connection, limit: int = 100) -> List[Dict[str, Any]]:
    engine = ExplainableRiskEngine()
    profiles = engine.evaluate_all_works(conn)
    results = []
    for p in profiles[:limit]:
        cur = conn.cursor()
        w = cur.execute("SELECT mp_name, state, constituency, work_status, sanction_amount FROM work WHERE work_id = ?", (p.work_id,)).fetchone()
        exp = cur.execute("SELECT SUM(fund_disbursed_amount) FROM expenditure_transaction WHERE work_id = ?", (p.work_id,)).fetchone()[0] or 0
        comp = cur.execute("SELECT completion_date FROM completion WHERE work_id = ?", (p.work_id,)).fetchone()
        
        results.append({
            "work_id": p.work_id,
            "mp_name": w[0] if w else None,
            "state": w[1] if w else None,
            "constituency": w[2] if w else None,
            "work_status": w[3] if w else None,
            "sanction_amount": w[4] if w else 0,
            "total_expenditure": exp,
            "has_completion_record": comp is not None,
            "risk_score": int(p.risk_score),
            "risk_level": p.risk_level,
            "confidence": p.confidence,
            "factor_scores": p.factor_scores,
            "explanations": p.explanations
        })
    return results

def compute_mp_risk_scores(conn: sqlite3.Connection, limit: int = 50) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    query = """
    SELECT
        m.mp_id,
        m.mp_name,
        m.state,
        m.constituency,
        m.allocated_amount,
        m.total_expenditure,
        (m.allocated_amount - m.total_expenditure) AS unspent_balance,
        m.partially_completed_works,
        (
            (CASE WHEN m.total_expenditure < (m.allocated_amount * 0.5) THEN 25 ELSE 0 END) +
            MIN(COALESCE(m.partially_completed_works, 0) * 5, 35) +
            (CASE WHEN m.expenditure_exceeds_allocation = 1 THEN 40 ELSE 0 END)
        ) AS mp_risk_score
    FROM monitoring_mp m
    ORDER BY mp_risk_score DESC
    LIMIT ?;
    """
    rows = cur.execute(query, (limit,)).fetchall()
    results = []
    for r in rows:
        score = min(int(r[8]), 100)
        level = "HIGH" if score >= 50 else ("MEDIUM" if score >= 25 else "LOW")
        results.append({
            "mp_id": r[0],
            "mp_name": r[1],
            "state": r[2],
            "constituency": r[3],
            "allocated_amount": r[4],
            "total_expenditure": r[5],
            "unspent_balance": r[6],
            "partially_completed_works": r[7],
            "risk_score": score,
            "risk_level": level
        })
    return results
