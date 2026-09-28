from typing import Optional
from pydantic import BaseModel

class WorkMonitoringIndicator(BaseModel):
    work_id: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    sanction_amount: Optional[float] = None
    total_expenditure: Optional[float] = None
    expenditure_transaction_count: int
    has_completion_record: bool
    expenditure_exceeds_sanction: bool
    no_expenditure_record: bool
    expenditure_without_completion_record: bool
    days_from_recommendation_to_sanction: Optional[float] = None
    days_from_sanction_to_first_expenditure: Optional[float] = None

class MPMonitoringIndicator(BaseModel):
    mp_id: int
    mp_name: str
    state: str
    constituency: str
    allocated_amount: Optional[float] = None
    total_sanction_amount: Optional[float] = None
    total_expenditure: Optional[float] = None
    unspent_balance: Optional[float] = None
    expenditure_percentage: Optional[float] = None
    partially_completed_works: int
    works_with_no_expenditure: int
    works_with_exp_without_completion: int
