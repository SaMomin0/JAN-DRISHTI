from typing import Optional
from pydantic import BaseModel

class AISignalItem(BaseModel):
    signal_id: int
    signal_type: str
    entity_type: str
    entity_id: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    severity: str
    reason: str
    supporting_value: Optional[float] = None
    threshold_value: Optional[float] = None
    created_at: str

class AnomalyItem(BaseModel):
    work_id: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    work_status: Optional[str] = None
    sanction_amount: Optional[float] = None
    total_expenditure: Optional[float] = None
    anomaly_type: str
    description: str
    risk_level: str
