import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Query
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.signal import AnomalyItem

router = APIRouter(prefix="/api/v1/anomalies", tags=["Anomalies"])

@router.get("", response_model=PaginatedResponse[AnomalyItem])
def list_anomalies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = Query(None, description="Filter by severity: REVIEW or INFO"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly/signal type"),
    state: Optional[str] = Query(None, description="Filter by state"),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve filtered list of operational and financial anomalies."""
    cur = db.cursor()
    
    where_clauses = ["1=1"]
    params = []
    
    if severity:
        where_clauses.append("s.severity = ?")
        params.append(severity)
    if anomaly_type:
        where_clauses.append("s.signal_type = ?")
        params.append(anomaly_type)
    if state:
        where_clauses.append("s.state = ?")
        params.append(state)
        
    where_sql = " AND ".join(where_clauses)
    
    # Total count
    cur.execute(f"SELECT COUNT(*) FROM ai_signal s WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
    SELECT
        s.entity_id AS work_id,
        s.mp_name,
        s.state,
        s.constituency,
        w.work_status,
        w.sanction_amount,
        COALESCE(e.total_expenditure, 0) AS total_expenditure,
        s.signal_type AS anomaly_type,
        s.reason AS description,
        s.severity AS risk_level
    FROM ai_signal s
    LEFT JOIN work w ON s.entity_id = w.work_id
    LEFT JOIN work_expenditure_summary e ON s.entity_id = e.work_id
    WHERE {where_sql}
    ORDER BY s.severity DESC, s.signal_id ASC
    LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    data = [
        AnomalyItem(
            work_id=r["work_id"],
            mp_name=r["mp_name"],
            state=r["state"],
            constituency=r["constituency"],
            work_status=r["work_status"],
            sanction_amount=r["sanction_amount"],
            total_expenditure=r["total_expenditure"],
            anomaly_type=r["anomaly_type"],
            description=r["description"],
            risk_level=r["risk_level"]
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
