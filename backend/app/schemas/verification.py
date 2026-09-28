"""
Pydantic schemas for Layer 5: Officer Investigation Workbench.
"""

from typing import Optional
from pydantic import BaseModel, Field


class VerificationActionCreate(BaseModel):
    case_id: str
    work_id: str
    action_type: str = Field(..., description="FIELD_INSPECTION, DOCUMENT_REVIEW, OFFICER_NOTE, ESCALATE, CLOSE, REQUEST_INFO")
    action_status: Optional[str] = Field("PENDING", description="PENDING, IN_PROGRESS, COMPLETED, CANCELLED")
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    notes: Optional[str] = None
    finding: Optional[str] = None


class VerificationActionUpdate(BaseModel):
    action_status: Optional[str] = Field(None, description="PENDING, IN_PROGRESS, COMPLETED, CANCELLED")
    notes: Optional[str] = None
    finding: Optional[str] = None
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None


class VerificationActionResponse(BaseModel):
    action_id: str
    case_id: str
    work_id: str
    action_type: str
    action_status: str
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    notes: Optional[str] = None
    finding: Optional[str] = None
    action_date: str
    updated_at: str
