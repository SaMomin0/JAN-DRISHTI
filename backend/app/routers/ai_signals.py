import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Query
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.signal import AISignalItem

router = APIRouter(prefix="/api/v1/ai-signals", tags=["AI Signals"])

@router.get("", response_model=PaginatedResponse[AISignalItem])
def list_ai_signals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    signal_type: Optional[str] = Query(None, description="Filter by signal type"),
    severity: Optional[str] = Query(None, description="Filter by severity: REVIEW or INFO"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type: WORK, MP, VENDOR"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    state: Optional[str] = Query(None, description="Filter by State"),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve paginated list of AI-generated anomaly and monitoring signals."""
    cur = db.cursor()
    where = ["1=1"]
    params = []
    
    if signal_type:
        where.append("signal_type = ?")
        params.append(signal_type)
    if severity:
        where.append("severity = ?")
        params.append(severity)
    if entity_type:
        where.append("entity_type = ?")
        params.append(entity_type)
    if entity_id:
        where.append("entity_id = ?")
        params.append(entity_id)
    if state:
        where.append("state = ?")
        params.append(state)
        
    where_sql = " AND ".join(where)
    cur.execute(f"SELECT COUNT(*) FROM ai_signal WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
    SELECT
        signal_id, signal_type, entity_type, entity_id,
        mp_name, state, constituency, severity, reason,
        supporting_value, threshold_value, created_at
    FROM ai_signal
    WHERE {where_sql}
    ORDER BY signal_id ASC
    LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    data = [
        AISignalItem(
            signal_id=r["signal_id"],
            signal_type=r["signal_type"],
            entity_type=r["entity_type"],
            entity_id=r["entity_id"],
            mp_name=r["mp_name"],
            state=r["state"],
            constituency=r["constituency"],
            severity=r["severity"],
            reason=r["reason"],
            supporting_value=r["supporting_value"],
            threshold_value=r["threshold_value"],
            created_at=r["created_at"]
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
