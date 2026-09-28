import json
from backend.app.schemas.risk_case import RiskCaseListItem, RiskCaseDetail, RiskCaseCreate, RiskCaseStatusUpdate
import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from backend.database.connection import get_db
from backend.app.schemas.risk import (
    RiskDistributionResponse,
    RiskFactorSummaryResponse,
    AnomalyResponse
)
from backend.pipeline.risk_engine import RiskEngineConfig

router = APIRouter(tags=["Risk Engine & Anomalies"])

@router.get("/api/v1/risk/distribution", response_model=RiskDistributionResponse)
def get_risk_distribution(db: sqlite3.Connection = Depends(get_db)):
    """Retrieve platform-wide risk score distribution (HIGH, MEDIUM, LOW)."""
    cur = db.cursor()
    cur.execute("""
    SELECT risk_level, COUNT(*) FROM project_risk
    WHERE run_id = (SELECT run_id FROM analysis_run ORDER BY timestamp DESC LIMIT 1)
    GROUP BY risk_level;
    """)
    rows = cur.fetchall()
    
    dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in rows:
        dist[r[0]] = r[1]
        
    total = sum(dist.values())
    if total == 0:
        # Fallback if no stored runs
        cur.execute("SELECT COUNT(*) FROM work;")
        total = cur.fetchone()[0]
        dist["LOW"] = total
        
    pcts = {
        k: round((v / total) * 100.0, 1) if total > 0 else 0.0
        for k, v in dist.items()
    }
    return RiskDistributionResponse(
        total_projects=total,
        distribution=dist,
        percentages=pcts
    )

@router.get("/api/v1/risk/factors", response_model=RiskFactorSummaryResponse)
def get_risk_factors(db: sqlite3.Connection = Depends(get_db)):
    """Retrieve risk engine factor weights and top contributing factors across platform."""
    config = RiskEngineConfig()
    cur = db.cursor()
    
    cur.execute("""
    SELECT anomaly_type, COUNT(*), AVG(score) FROM project_anomaly
    GROUP BY anomaly_type
    ORDER BY COUNT(*) DESC;
    """)
    rows = cur.fetchall()
    
    top_factors = [
        {"factor_name": r[0], "anomaly_count": r[1], "average_score": round(r[2], 1)}
        for r in rows
    ]
    
    return RiskFactorSummaryResponse(
        factor_weights=config.weights,
        top_risk_factors=top_factors
    )

@router.get("/api/v1/platform-anomalies", response_model=List[AnomalyResponse])  # renamed to avoid duplicate operation ID
def list_anomalies(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type"),
    limit: int = Query(50, ge=1, le=500),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve platform-wide list of detected anomalies."""
    cur = db.cursor()
    where_clauses = ["1=1"]
    params = []
    
    if severity:
        where_clauses.append("severity = ?")
        params.append(severity.upper())
    if anomaly_type:
        where_clauses.append("anomaly_type = ?")
        params.append(anomaly_type)
        
    where_sql = " AND ".join(where_clauses)
    
    query = f"""
    SELECT anomaly_id, work_id, run_id, detector_name, anomaly_type, severity, score, confidence, reason, comparison_group, comparison_statistics_json, created_at
    FROM project_anomaly
    WHERE {where_sql}
    ORDER BY score DESC, created_at DESC
    LIMIT ?;
    """
    cur.execute(query, params + [limit])
    rows = cur.fetchall()
    
    results = []
    for r in rows:
        results.append(AnomalyResponse(
            anomaly_id=r["anomaly_id"],
            work_id=r["work_id"],
            run_id=r["run_id"],
            detector_name=r["detector_name"],
            anomaly_type=r["anomaly_type"],
            severity=r["severity"],
            score=r["score"],
            confidence=r["confidence"],
            reason=r["reason"],
            comparison_group=json.loads(r["comparison_group"]) if r["comparison_group"] else None,
            comparison_statistics=json.loads(r["comparison_statistics_json"]) if r["comparison_statistics_json"] else None,
            created_at=r["created_at"]
        ))
    return results
