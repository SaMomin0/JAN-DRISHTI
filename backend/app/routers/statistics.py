import sqlite3
from fastapi import APIRouter, Depends
from backend.database.connection import get_db
from backend.app.schemas.statistics import (
    StatisticsResponse, FinancialOverview, StatusBreakdown, TopMP, TopVendor
)

router = APIRouter(prefix="/api/v1/statistics", tags=["Statistics"])

@router.get("", response_model=StatisticsResponse)
def get_statistics(db: sqlite3.Connection = Depends(get_db)):
    """Retrieve comprehensive macro financial and progress analytics across all MPLADS works."""
    cur = db.cursor()
    
    # 1. Total Works and Sanction
    cur.execute("SELECT COUNT(*), COALESCE(SUM(sanction_amount), 0) FROM work;")
    total_works, total_sanction = cur.fetchone()
    
    # 2. Total Expenditure
    cur.execute("SELECT COALESCE(SUM(fund_disbursed_amount), 0) FROM expenditure_transaction;")
    total_expenditure = cur.fetchone()[0]
    
    # 3. Total Allocation
    cur.execute("SELECT COALESCE(SUM(allocated_amount), 0) FROM mp;")
    total_allocation = cur.fetchone()[0]
    
    # 4. Total Calamity
    cur.execute("SELECT COALESCE(SUM(consent_amount), 0) FROM calamity_consent;")
    total_calamity = cur.fetchone()[0]
    
    # 5. Completed Works Count
    cur.execute("SELECT COUNT(*) FROM completion;")
    completed_works = cur.fetchone()[0]
    
    exp_rate = round((total_expenditure / total_allocation * 100) if total_allocation else 0, 2)
    comp_rate = round((completed_works / total_works * 100) if total_works else 0, 2)
    
    overview = FinancialOverview(
        total_works=total_works,
        total_sanction_amount=round(total_sanction, 2),
        total_expenditure_amount=round(total_expenditure, 2),
        total_allocation_amount=round(total_allocation, 2),
        total_calamity_amount=round(total_calamity, 2),
        national_expenditure_rate_pct=exp_rate,
        completed_works_count=completed_works,
        completion_rate_pct=comp_rate
    )
    
    # 6. Status Breakdown — handle both DB schemas (total_sanctioned_amount vs total_sanction_amount)
    cur.execute("SELECT * FROM work_status_summary ORDER BY work_count DESC;")
    status_rows = cur.fetchall()
    status_breakdown = [
        StatusBreakdown(
            work_status=r["work_status"],
            work_count=r["work_count"],
            total_sanction_amount=round(
                dict(r).get("total_sanction_amount") or dict(r).get("total_sanctioned_amount") or 0.0, 2
            )
        )
        for r in status_rows
    ]
    
    # 7. Top MPs by Expenditure — normalize column names across old/new DB schemas
    cur.execute("SELECT * FROM mp_summary ORDER BY total_expenditure DESC LIMIT 10;")
    top_mp_rows = cur.fetchall()
    top_mps = [
        TopMP(
            mp_name=dict(r).get("mp_name"),
            state=dict(r).get("state"),
            constituency=dict(r).get("constituency"),
            total_works_sanctioned=dict(r).get("total_works_sanctioned") or dict(r).get("total_works") or 0,
            total_expenditure=round(dict(r).get("total_expenditure") or 0.0, 2),
            expenditure_percentage=round(
                dict(r).get("expenditure_percentage") or dict(r).get("expenditure_vs_allocation_percent") or 0.0, 2
            )
        )
        for r in top_mp_rows
    ]
    
    # 8. Top Vendors by Disbursed Amount — SELECT * then normalize in Python for schema portability
    cur.execute("SELECT * FROM vendor_summary;")
    vendor_rows = cur.fetchall()
    vendor_dicts = [dict(r) for r in vendor_rows]
    # Sort by whichever amount column exists
    vendor_dicts.sort(
        key=lambda r: r.get("total_disbursed_amount") or r.get("total_amount_received") or 0.0,
        reverse=True
    )
    vendor_dicts = vendor_dicts[:10]
    top_vendors = [
        TopVendor(
            vendor_name=r.get("vendor_name"),
            distinct_works_count=r.get("distinct_works_count") or r.get("total_works") or 0,
            transaction_count=r.get("transaction_count") or r.get("total_transactions") or 0,
            total_disbursed_amount=round(r.get("total_disbursed_amount") or r.get("total_amount_received") or 0.0, 2)
        )
        for r in vendor_dicts
    ]
    
    return StatisticsResponse(
        financial_overview=overview,
        status_breakdown=status_breakdown,
        top_mps_by_expenditure=top_mps,
        top_vendors_by_amount=top_vendors
    )
