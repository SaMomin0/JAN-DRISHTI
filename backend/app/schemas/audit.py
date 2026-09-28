"""
Pydantic schemas for Layer 6: Audit and Outcome History.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class AuditEventCreate(BaseModel):
    event_type: str = Field(..., description="e.g. CASE_CREATED, CASE_STATUS_CHANGED, VERIFICATION_ADDED, SIGNAL_GENERATED")
    entity_type: str = Field(..., description="e.g. RISK_CASE, VERIFICATION_ACTION, WORK, SIGNAL")
    entity_id: str
    description: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditLogResponse(BaseModel):
    audit_id: str
    event_type: str
    entity_type: str
    entity_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    description: str
    metadata_json: Optional[str] = None
    created_at: str
