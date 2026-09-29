import json
import sqlite3
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.project import ProjectBase, ProjectDetail
from backend.app.schemas.risk import (
    ProjectRiskResponse,
    AnomalyResponse,
    EvidenceResponse,
    ComparableProjectResponse,
    ProjectHistoryResponse
)

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

@router.get("", response_model=PaginatedResponse[ProjectBase])
def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    q: Optional[str] = Query(None, description="General full-text search across title, description, MP, or work_id"),
    state: Optional[str] = Query(None, description="Filter by State"),
    constituency: Optional[str] = Query(None, description="Filter by Constituency"),
    mp_name: Optional[str] = Query(None, description="Filter by MP Name (partial match)"),
    work_status: Optional[str] = Query(None, description="Filter by Work Status"),
    min_amount: Optional[float] = Query(None, description="Minimum sanction amount"),
    max_amount: Optional[float] = Query(None, description="Maximum sanction amount"),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve paginated list of MPLADS projects with optional filters."""
    cur = db.cursor()
    
    where_clauses = ["1=1"]
    params = []
    
    if q:
        where_clauses.append("(work LIKE ? OR work_description LIKE ? OR mp_name LIKE ? OR work_id LIKE ?)")
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])
    if state:
        where_clauses.append("state = ?")
        params.append(state)
    if constituency:
        where_clauses.append("constituency = ?")
        params.append(constituency)
    if mp_name:
        where_clauses.append("mp_name LIKE ?")
        params.append(f"%{mp_name}%")
    if work_status:
        where_clauses.append("work_status = ?")
        params.append(work_status)
    if min_amount is not None:
        where_clauses.append("sanction_amount >= ?")
        params.append(min_amount)
    if max_amount is not None:
        where_clauses.append("sanction_amount <= ?")
        params.append(max_amount)
        
    where_sql = " AND ".join(where_clauses)
    
    cur.execute(f"SELECT COUNT(*) FROM work WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
    SELECT
        work_id, work_category, work, state, ida,
        mp_name, constituency, work_description,
        recommended_date, sanction_date, sanction_amount, work_status
    FROM work
    WHERE {where_sql}
    ORDER BY sanction_date DESC, work_id DESC
    LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    data = [
        ProjectBase(
            work_id=r["work_id"],
            work_category=r["work_category"],
            work=r["work"],
            state=r["state"],
            ida=r["ida"],
            mp_name=r["mp_name"],
            constituency=r["constituency"],
            work_description=r["work_description"],
            recommended_date=r["recommended_date"],
            sanction_date=r["sanction_date"],
            sanction_amount=r["sanction_amount"],
            work_status=r["work_status"]
        )
        for r in rows
    ]
    
    total_pages = (total_records + page_size - 1) // page_size
    return PaginatedResponse(
        data=data,
        pagination=PaginationMeta(
            total_records=total_records,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.get("/{project_id}/risk", response_model=ProjectRiskResponse)
def get_project_risk(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve risk score, risk level, confidence, and factor breakdown for a project."""
    cur = db.cursor()
    cur.execute("""
    SELECT work_id, run_id, risk_score, risk_level, confidence, factor_scores_json, explanation_json, updated_at
    FROM project_risk
    WHERE work_id = ?
    ORDER BY updated_at DESC LIMIT 1;
    """, (project_id,))
    row = cur.fetchone()
    if not row:
        # Fallback: calculate on-the-fly using risk engine
        from backend.pipeline.risk_engine import ExplainableRiskEngine
        engine = ExplainableRiskEngine()
        cur.execute("SELECT * FROM work WHERE work_id = ?;", (project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
        anoms = engine.run_detection(db).get(project_id, [])
        prof = engine.calculate_risk_profile(project_id, anoms)
        return ProjectRiskResponse(
            work_id=project_id,
            run_id="on_demand",
            risk_score=prof.risk_score,
            risk_level=prof.risk_level,
            confidence=prof.confidence,
            factor_scores=prof.factor_scores,
            explanations=prof.explanations,
            updated_at="now"
        )
    
    return ProjectRiskResponse(
        work_id=row["work_id"],
        run_id=row["run_id"],
        risk_score=row["risk_score"],
        risk_level=row["risk_level"],
        confidence=row["confidence"],
        factor_scores=json.loads(row["factor_scores_json"]),
        explanations=json.loads(row["explanation_json"]),
        updated_at=row["updated_at"]
    )

@router.get("/{project_id}/anomalies", response_model=List[AnomalyResponse])
def get_project_anomalies(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve all detected anomalies for a project."""
    cur = db.cursor()
    cur.execute("""
    SELECT anomaly_id, work_id, run_id, detector_name, anomaly_type, severity, score, confidence, reason, comparison_group, comparison_statistics_json, created_at
    FROM project_anomaly
    WHERE work_id = ?
    ORDER BY score DESC;
    """, (project_id,))
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

@router.get("/{project_id}/evidence", response_model=List[EvidenceResponse])
def get_project_evidence(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve detailed empirical evidence records for a project."""
    cur = db.cursor()
    cur.execute("""
    SELECT evidence_id, anomaly_id, work_id, source_dataset, source_record_id, observed_value, comparison_value, difference_value, evidence_json
    FROM project_evidence
    WHERE work_id = ?;
    """, (project_id,))
    rows = cur.fetchall()
    
    results = []
    for r in rows:
        results.append(EvidenceResponse(
            evidence_id=r["evidence_id"],
            anomaly_id=r["anomaly_id"],
            work_id=r["work_id"],
            source_dataset=r["source_dataset"],
            source_record_id=r["source_record_id"],
            observed_value=r["observed_value"],
            comparison_value=r["comparison_value"],
            difference_value=r["difference_value"],
            evidence_details=json.loads(r["evidence_json"])
        ))
    return results

@router.get("/{project_id}/comparables", response_model=List[ComparableProjectResponse])
def get_project_comparables(
    project_id: str,
    limit: int = Query(5, ge=1, le=20),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve comparable peer projects in the same state/constituency/category."""
    cur = db.cursor()
    cur.execute("SELECT state, constituency, work_category, sanction_amount FROM work WHERE work_id = ?;", (project_id,))
    target = cur.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
        
    state, constituency, cat, amount = target["state"], target["constituency"], target["work_category"], target["sanction_amount"]
    
    cur.execute("""
    SELECT work_id, mp_name, state, constituency, work_category, sanction_amount
    FROM work
    WHERE state = ? AND constituency = ? AND work_id != ?
    ORDER BY ABS(COALESCE(sanction_amount, 0) - ?) ASC
    LIMIT ?;
    """, (state, constituency, project_id, amount or 0, limit))
    rows = cur.fetchall()
    
    results = []
    for r in rows:
        results.append(ComparableProjectResponse(
            work_id=r["work_id"],
            mp_name=r["mp_name"],
            state=r["state"],
            constituency=r["constituency"],
            work_category=r["work_category"],
            sanction_amount=r["sanction_amount"],
            similarity_context=f"Same Constituency ({constituency}), State ({state})"
        ))
    return results

@router.get("/{project_id}/history", response_model=ProjectHistoryResponse)
def get_project_history(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve chronological lifecycle timeline for a project."""
    cur = db.cursor()
    cur.execute("SELECT recommended_date, sanction_date, work_status FROM work WHERE work_id = ?;", (project_id,))
    w = cur.fetchone()
    if not w:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
        
    cur.execute("""
    SELECT MIN(expenditure_date), MAX(expenditure_date), SUM(fund_disbursed_amount), COUNT(*)
    FROM expenditure_transaction WHERE work_id = ?;
    """, (project_id,))
    exp = cur.fetchone()
    
    cur.execute("SELECT completion_date FROM completion WHERE work_id = ?;", (project_id,))
    comp = cur.fetchone()
    
    return ProjectHistoryResponse(
        work_id=project_id,
        sanction_date=w["sanction_date"],
        recommended_date=w["recommended_date"],
        first_expenditure_date=exp[0] if exp else None,
        latest_expenditure_date=exp[1] if exp else None,
        completion_date=comp["completion_date"] if comp else None,
        total_expenditure=exp[2] or 0.0,
        transaction_count=exp[3] or 0,
        work_status=w["work_status"]
    )

@router.get("/{project_id}", response_model=ProjectDetail)
def get_project_by_id(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve detailed project record, associated expenditure transactions, and AI signals."""
    cur = db.cursor()
    cur.execute("SELECT * FROM work_summary WHERE work_id = ?;", (project_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found")
    
    row_dict = dict(row)
    transaction_count = row_dict.get("transaction_count") or row_dict.get("expenditure_transaction_count") or 0
    total_expenditure = row_dict.get("total_expenditure") or 0.0
    sanction_amount = row_dict.get("sanction_amount") or 0.0
    
    exp_pct = row_dict.get("expenditure_vs_sanction_percent")
    if exp_pct is None:
        exp_pct = round((total_expenditure / sanction_amount) * 100, 2) if sanction_amount else 0.0
    remaining = row_dict.get("remaining_sanction_amount")
    if remaining is None:
        remaining = round(sanction_amount - total_expenditure, 2)
        
    cur.execute("""
    SELECT transaction_id, expenditure_date, vendor_name, payment_status, fund_disbursed_amount
    FROM expenditure_transaction
    WHERE work_id = ?
    ORDER BY expenditure_date ASC;
    """, (project_id,))
    tx_rows = cur.fetchall()
    transactions = [dict(t) for t in tx_rows]
    
    signals = []
    try:
        cur.execute("""
        SELECT signal_id, signal_type, severity, reason, supporting_value, threshold_value, created_at
        FROM ai_signal
        WHERE entity_type = 'WORK' AND entity_id = ?
        ORDER BY severity DESC, signal_id ASC;
        """, (project_id,))
        signals = [dict(s) for s in cur.fetchall()]
    except Exception:
        pass
    
    return ProjectDetail(
        work_id=row_dict["work_id"],
        work_category=row_dict.get("work_category"),
        work=row_dict.get("work"),
        state=row_dict.get("state"),
        ida=row_dict.get("ida"),
        mp_name=row_dict.get("mp_name"),
        constituency=row_dict.get("constituency"),
        work_description=row_dict.get("work_description"),
        recommended_date=row_dict.get("recommended_date"),
        sanction_date=row_dict.get("sanction_date"),
        sanction_amount=sanction_amount,
        work_status=row_dict.get("work_status"),
        total_expenditure=total_expenditure,
        transaction_count=transaction_count,
        first_expenditure_date=row_dict.get("first_expenditure_date"),
        latest_expenditure_date=row_dict.get("latest_expenditure_date"),
        has_completion_record=bool(row_dict.get("has_completion_record", 0)),
        completion_date=row_dict.get("completion_date"),
        completion_amount_disbursed=row_dict.get("completion_amount_disbursed"),
        expenditure_vs_sanction_percent=exp_pct,
        remaining_sanction_amount=remaining,
        signals=signals,
        transactions=transactions
    )
