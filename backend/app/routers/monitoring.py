import sqlite3
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.indicator import WorkMonitoringIndicator, MPMonitoringIndicator

router = APIRouter(prefix="/api/v1/monitoring-indicators", tags=["Monitoring Indicators"])

@router.get("/works", response_model=PaginatedResponse[WorkMonitoringIndicator])
def get_work_monitoring_indicators(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    no_expenditure: Optional[bool] = Query(None, description="Filter works with no expenditure"),
    exp_without_completion: Optional[bool] = Query(None, description="Filter works with expenditure but no completion"),
    state: Optional[str] = Query(None),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve work-level monitoring metrics and lag indicators."""
    cur = db.cursor()
    where = ["1=1"]
    params = []
    
    if no_expenditure is not None:
        where.append("no_expenditure_record = ?")
        params.append(1 if no_expenditure else 0)
    if exp_without_completion is not None:
        where.append("expenditure_without_completion_record = ?")
        params.append(1 if exp_without_completion else 0)
    if state:
        where.append("state = ?")
        params.append(state)
        
    where_sql = " AND ".join(where)
    cur.execute(f"SELECT COUNT(*) FROM monitoring_work WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
    SELECT
        work_id, mp_name, state, constituency,
        sanction_amount, total_expenditure,
        expenditure_transaction_count, has_completion_record,
        expenditure_exceeds_sanction, no_expenditure_record,
        expenditure_without_completion_record,
        NULL AS days_from_recommendation_to_sanction,
        days_sanction_to_first_expenditure AS days_from_sanction_to_first_expenditure
    FROM monitoring_work
    WHERE {where_sql}
    ORDER BY total_expenditure DESC
    LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    data = [
        WorkMonitoringIndicator(
            work_id=r["work_id"],
            mp_name=r["mp_name"],
            state=r["state"],
            constituency=r["constituency"],
            sanction_amount=r["sanction_amount"],
            total_expenditure=r["total_expenditure"],
            expenditure_transaction_count=r["expenditure_transaction_count"],
            has_completion_record=bool(r["has_completion_record"]),
            expenditure_exceeds_sanction=bool(r["expenditure_exceeds_sanction"]),
            no_expenditure_record=bool(r["no_expenditure_record"]),
            expenditure_without_completion_record=bool(r["expenditure_without_completion_record"]),
            days_from_recommendation_to_sanction=r["days_from_recommendation_to_sanction"],
            days_from_sanction_to_first_expenditure=r["days_from_sanction_to_first_expenditure"]
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

@router.get("/mps", response_model=PaginatedResponse[MPMonitoringIndicator])
def get_mp_monitoring_indicators(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    state: Optional[str] = Query(None),
    has_partial_works: Optional[bool] = Query(None),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve MP-level portfolio monitoring metrics and unspent balances."""
    cur = db.cursor()
    where = ["1=1"]
    params = []
    
    if state:
        where.append("state = ?")
        params.append(state)
    if has_partial_works is not None:
        where.append("partially_completed_works > 0" if has_partial_works else "partially_completed_works = 0")
        
    where_sql = " AND ".join(where)
    cur.execute(f"SELECT COUNT(*) FROM monitoring_mp WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
    SELECT *
    FROM monitoring_mp
    WHERE {where_sql}
    ORDER BY total_expenditure DESC
    LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    data = []
    for r in rows:
        rd = dict(r)
        alloc = rd.get("allocated_amount") or 0.0
        exp = rd.get("total_expenditure") or 0.0
        sanction = rd.get("total_sanction_amount") or rd.get("total_sanctioned_amount") or 0.0
        unspent = rd.get("unspent_balance") or rd.get("remaining_allocation") or round(alloc - exp, 2)
        exp_pct = rd.get("expenditure_percentage") or rd.get("expenditure_vs_allocation_percent") or (
            round(exp / alloc * 100, 2) if alloc else 0.0
        )
        data.append(MPMonitoringIndicator(
            mp_id=rd["mp_id"],
            mp_name=rd.get("mp_name"),
            state=rd.get("state"),
            constituency=rd.get("constituency"),
            allocated_amount=alloc,
            total_sanction_amount=sanction,
            total_expenditure=exp,
            unspent_balance=unspent,
            expenditure_percentage=exp_pct,
            partially_completed_works=rd.get("partially_completed_works") or 0,
            works_with_no_expenditure=rd.get("works_with_no_expenditure") or 0,
            works_with_exp_without_completion=rd.get("works_with_exp_without_completion") or 0
        ))
    
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
