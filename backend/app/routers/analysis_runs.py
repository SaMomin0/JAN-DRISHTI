import json
import sqlite3
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database.connection import get_db
from backend.app.schemas.risk import AnalysisRunCreate, AnalysisRunResponse
from backend.pipeline.risk_engine import ExplainableRiskEngine
from backend.pipeline.runner import persist_analysis_run

router = APIRouter(prefix="/api/v1/analysis-runs", tags=["Analysis Runs"])

@router.get("", response_model=List[AnalysisRunResponse])
def list_analysis_runs(db: sqlite3.Connection = Depends(get_db)):
    """Retrieve history of analysis runs."""
    cur = db.cursor()
    try:
        cur.execute("""
        SELECT run_id, dataset_hash, timestamp, rules_version, detector_versions, project_count, anomaly_count, risk_distribution_json
        FROM analysis_run
        ORDER BY timestamp DESC;
        """)
        rows = cur.fetchall()
    except Exception:
        rows = []

    if not rows:
        # If no runs in table yet, execute a run to populate real database state
        engine = ExplainableRiskEngine()
        summary = persist_analysis_run(db, engine)
        return [
            AnalysisRunResponse(
                run_id=summary["run_id"],
                dataset_hash=summary["dataset_hash"],
                timestamp=summary["timestamp"],
                rules_version=summary["rules_version"],
                detector_versions={d.name: d.version for d in engine.detectors},
                project_count=summary["project_count"],
                anomaly_count=summary["anomaly_count"],
                risk_distribution=summary["risk_distribution"]
            )
        ]

    results = []
    for r in rows:
        results.append(AnalysisRunResponse(
            run_id=r["run_id"],
            dataset_hash=r["dataset_hash"],
            timestamp=r["timestamp"],
            rules_version=r["rules_version"],
            detector_versions=json.loads(r["detector_versions"]),
            project_count=r["project_count"],
            anomaly_count=r["anomaly_count"],
            risk_distribution=json.loads(r["risk_distribution_json"])
        ))
    return results

@router.post("", response_model=AnalysisRunResponse, status_code=201)
def create_analysis_run(
    payload: Optional[AnalysisRunCreate] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Trigger a new analysis run on current database datasets."""
    engine = ExplainableRiskEngine()
    summary = persist_analysis_run(db, engine)
    return AnalysisRunResponse(
        run_id=summary["run_id"],
        dataset_hash=summary["dataset_hash"],
        timestamp=summary["timestamp"],
        rules_version=summary["rules_version"],
        detector_versions={d.name: d.version for d in engine.detectors},
        project_count=summary["project_count"],
        anomaly_count=summary["anomaly_count"],
        risk_distribution=summary["risk_distribution"]
    )

@router.post("/{run_id}/execute", response_model=AnalysisRunResponse)
def execute_analysis_run(
    run_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Re-execute a specific analysis run."""
    engine = ExplainableRiskEngine()
    summary = persist_analysis_run(db, engine)
    return AnalysisRunResponse(
        run_id=summary["run_id"],
        dataset_hash=summary["dataset_hash"],
        timestamp=summary["timestamp"],
        rules_version=summary["rules_version"],
        detector_versions={d.name: d.version for d in engine.detectors},
        project_count=summary["project_count"],
        anomaly_count=summary["anomaly_count"],
        risk_distribution=summary["risk_distribution"]
    )

@router.get("/{run_id}", response_model=AnalysisRunResponse)
def get_analysis_run(
    run_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve details of a specific analysis run."""
    cur = db.cursor()
    cur.execute("""
    SELECT run_id, dataset_hash, timestamp, rules_version, detector_versions, project_count, anomaly_count, risk_distribution_json
    FROM analysis_run
    WHERE run_id = ?;
    """, (run_id,))
    r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail=f"Analysis run '{run_id}' not found")
        
    return AnalysisRunResponse(
        run_id=r["run_id"],
        dataset_hash=r["dataset_hash"],
        timestamp=r["timestamp"],
        rules_version=r["rules_version"],
        detector_versions=json.loads(r["detector_versions"]),
        project_count=r["project_count"],
        anomaly_count=r["anomaly_count"],
        risk_distribution=json.loads(r["risk_distribution_json"])
    )
