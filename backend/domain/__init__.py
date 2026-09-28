"""
Domain package for JAN-DRISHTI MPLADS Intelligence Platform.
Exports canonical domain models for all six architecture layers.
"""

from .models import (
    # Layer 2 — Signal Engine
    SignalType,
    SignalSeverity,
    Signal,
    # Layer 3 — Corroboration
    PeerContext,
    DataLimitation,
    CorroborationResult,
    # Layer 4 — Risk Case + Evidence
    RiskCaseStatus,
    EvidenceRole,
    Evidence,
    RiskCase,
    # Layer 5 — Investigation
    ActionType,
    ActionStatus,
    VerificationAction,
    # Layer 6 — Audit + History
    AuditEvent,
    AnalysisRunRecord,
)

__all__ = [
    "SignalType", "SignalSeverity", "Signal",
    "PeerContext", "DataLimitation", "CorroborationResult",
    "RiskCaseStatus", "EvidenceRole", "Evidence", "RiskCase",
    "ActionType", "ActionStatus", "VerificationAction",
    "AuditEvent", "AnalysisRunRecord",
]
