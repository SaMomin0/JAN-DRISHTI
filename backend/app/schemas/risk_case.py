"""
Pydantic schemas for Layer 4: Risk Case and Evidence Graph.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class RiskCaseEvidenceItem(BaseModel):
    rc_evidence_id: str
    case_id: str
    evidence_id: Optional[str] = None
    anomaly_id: Optional[str] = None
    evidence_role: str = "SUPPORTING"
    source_dataset: str
    source_record_id: Optional[str] = None
    description: str
    observed_value: Optional[float] = None
    comparison_value: Optional[float] = None
    created_at: str


class RiskCaseListItem(BaseModel):
    case_id: str
    work_id: str
    run_id: Optional[str] = None
    case_status: str
    priority: str
    signal_count: int = 0
    evidence_count: int = 0
    verification_recommendation: Optional[str] = None
    created_at: str
    updated_at: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    work_category: Optional[str] = None
    sanction_amount: Optional[float] = None
    work_status: Optional[str] = None


class RiskCaseDetail(BaseModel):
    case_id: str
    work_id: str
    run_id: Optional[str] = None
    case_status: str
    priority: str
    signal_count: int = 0
    evidence_count: int = 0
    peer_context: Optional[Dict[str, Any]] = None
    data_limitations: Optional[List[Dict[str, Any]]] = None
    verification_recommendation: Optional[str] = None
    created_at: str
    updated_at: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    work_category: Optional[str] = None
    sanction_amount: Optional[float] = None
    work_status: Optional[str] = None
    evidence: List[RiskCaseEvidenceItem] = Field(default_factory=list)
    signals: List[Dict[str, Any]] = Field(default_factory=list)


class RiskCaseStatusUpdate(BaseModel):
    case_status: str = Field(..., description="Target status: OPEN, UNDER_REVIEW, VERIFIED, CLOSED, ESCALATED")
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    notes: Optional[str] = None


class RiskCaseCreate(BaseModel):
    work_id: str
    priority: Optional[str] = "MEDIUM"
    verification_recommendation: Optional[str] = None
    run_id: Optional[str] = None
