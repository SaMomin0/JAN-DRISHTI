from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class FinancialOverview(BaseModel):
    total_works: int
    total_sanction_amount: float
    total_expenditure_amount: float
    total_allocation_amount: float
    total_calamity_amount: float
    national_expenditure_rate_pct: float
    completed_works_count: int
    completion_rate_pct: float

class StatusBreakdown(BaseModel):
    work_status: str
    work_count: int
    total_sanction_amount: float

class TopMP(BaseModel):
    mp_name: str
    state: str
    constituency: str
    total_works_sanctioned: int
    total_expenditure: float
    expenditure_percentage: float

class TopVendor(BaseModel):
    vendor_name: str
    distinct_works_count: int
    transaction_count: int
    total_disbursed_amount: float

class StatisticsResponse(BaseModel):
    financial_overview: FinancialOverview
    status_breakdown: List[StatusBreakdown]
    top_mps_by_expenditure: List[TopMP]
    top_vendors_by_amount: List[TopVendor]
