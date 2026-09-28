from typing import Optional, List
from pydantic import BaseModel

class ProjectBase(BaseModel):
    work_id: str
    work_category: Optional[str] = None
    work: Optional[str] = None
    state: Optional[str] = None
    ida: Optional[str] = None
    mp_name: Optional[str] = None
    constituency: Optional[str] = None
    work_description: Optional[str] = None
    recommended_date: Optional[str] = None
    sanction_date: Optional[str] = None
    sanction_amount: Optional[float] = None
    work_status: Optional[str] = None

class ProjectDetail(ProjectBase):
    total_expenditure: Optional[float] = 0.0
    transaction_count: Optional[int] = 0
    first_expenditure_date: Optional[str] = None
    latest_expenditure_date: Optional[str] = None
    has_completion_record: Optional[bool] = False
    completion_date: Optional[str] = None
    completion_amount_disbursed: Optional[float] = None
    expenditure_vs_sanction_percent: Optional[float] = 0.0
    remaining_sanction_amount: Optional[float] = 0.0
    signals: Optional[List[dict]] = []
    transactions: Optional[List[dict]] = []
