"""
Canonical Domain Models for JAN-DRISHTI MPLADS Intelligence Platform.

Six-Layer Architecture Domain Model Map:
  Layer 1 — Data Foundation:      MPRecord, WorkRecord (read from DB, not persisted here)
  Layer 2 — Signal Engine:        Signal, SignalType, SignalSeverity
  Layer 3 — Corroboration:        CorroborationResult, PeerContext, DataLimitation
  Layer 4 — Risk Case + Evidence: RiskCase, Evidence, EvidenceRole, RiskCaseStatus
  Layer 5 — Investigation:        VerificationAction, ActionType, ActionStatus
  Layer 6 — Audit + History:      AuditEvent, AnalysisRunRecord

Core principle: A Signal is NOT a verdict. It is a reason to investigate.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from enum import Enum


# ---------------------------------------------------------------------------
# Layer 2 — Signal Engine
# ---------------------------------------------------------------------------

class SignalType(str, Enum):
    """Five canonical signal types for the Intelligence Engine."""
    COST_ANOMALY = "COST_ANOMALY"
    DELAY_DEVIATION = "DELAY_DEVIATION"
    PAYMENT_PATTERN = "PAYMENT_PATTERN"
    SIMILAR_WORK = "SIMILAR_WORK"
    PROGRESS_MISMATCH = "PROGRESS_MISMATCH"


class SignalSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    INFO = "INFO"
    REVIEW = "REVIEW"


@dataclass
class Signal:
    """
    A detected unusual pattern in MPLADS data.
    A Signal is a reason to investigate — NOT a verdict.
    Signals are produced by detectors and consumed by the corroboration layer.
    """
    signal_id: str
    work_id: str
    signal_type: SignalType
    detector_name: str
    detector_version: str
    severity: SignalSeverity
    score: float                          # 0.0–100.0
    confidence: float                     # 0.0–1.0
    reason: str                           # Human-readable explanation
    evidence: Dict[str, Any] = field(default_factory=dict)
    comparison_group: Optional[Dict[str, Any]] = None
    comparison_statistics: Optional[Dict[str, Any]] = None
    data_limitations: List[str] = field(default_factory=list)
    run_id: Optional[str] = None
    created_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Layer 3 — Corroboration + Explainability
# ---------------------------------------------------------------------------

@dataclass
class PeerContext:
    """Statistical context from peer comparison."""
    comparison_group: Dict[str, Any]
    peer_count: int
    mean_value: Optional[float] = None
    median_value: Optional[float] = None
    std_value: Optional[float] = None
    percentile_rank: Optional[float] = None
    comparison_basis: str = ""


@dataclass
class DataLimitation:
    """Documents a known limitation that constrains signal confidence."""
    limitation_type: str          # e.g., MISSING_DATA, SMALL_PEER_GROUP, DATE_QUALITY
    description: str
    affected_signals: List[str] = field(default_factory=list)
    severity: str = "LOW"         # LOW | MEDIUM | HIGH


@dataclass
class CorroborationResult:
    """
    Aggregated corroboration outcome for a single project.
    Combines signal convergence, peer context, and evidence into a
    prioritized, explainable investigation recommendation.
    """
    work_id: str
    convergent_signals: List[Signal] = field(default_factory=list)
    divergent_signals: List[Signal] = field(default_factory=list)
    peer_context: Optional[PeerContext] = None
    data_limitations: List[DataLimitation] = field(default_factory=list)
    composite_score: float = 0.0
    priority: str = "LOW"                  # LOW | MEDIUM | HIGH | CRITICAL
    investigation_recommendation: str = ""
    explainability_notes: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Layer 4 — Risk Case + Evidence Graph
# ---------------------------------------------------------------------------

class RiskCaseStatus(str, Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"


class EvidenceRole(str, Enum):
    SUPPORTING = "SUPPORTING"
    COUNTER = "COUNTER"
    CONTEXTUAL = "CONTEXTUAL"


@dataclass
class Evidence:
    """
    Traceable information supporting or contextualizing a signal or Risk Case.
    Every piece of evidence must reference its source dataset and record.
    """
    evidence_id: str
    work_id: str
    source_dataset: str
    source_record_id: Optional[str]
    description: str
    observed_value: Optional[float] = None
    comparison_value: Optional[float] = None
    difference_value: Optional[float] = None
    evidence_details: Dict[str, Any] = field(default_factory=dict)
    anomaly_id: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class RiskCase:
    """
    A project-level investigation object — the primary output of the platform.
    Connects signals, evidence, peer context, and verification for one project.
    A Risk Case does NOT assert guilt — it assembles traceable reasons to investigate.
    """
    case_id: str
    work_id: str
    run_id: Optional[str]
    case_status: RiskCaseStatus = RiskCaseStatus.OPEN
    priority: str = "MEDIUM"
    signals: List[Signal] = field(default_factory=list)
    supporting_evidence: List[Evidence] = field(default_factory=list)
    counter_evidence: List[Evidence] = field(default_factory=list)
    peer_context: Optional[PeerContext] = None
    data_limitations: List[DataLimitation] = field(default_factory=list)
    verification_recommendation: Optional[str] = None
    signal_count: int = 0
    evidence_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Layer 5 — Officer Investigation Workbench
# ---------------------------------------------------------------------------

class ActionType(str, Enum):
    FIELD_INSPECTION = "FIELD_INSPECTION"
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW"
    OFFICER_NOTE = "OFFICER_NOTE"
    ESCALATE = "ESCALATE"
    CLOSE = "CLOSE"
    REQUEST_INFO = "REQUEST_INFO"


class ActionStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


@dataclass
class VerificationAction:
    """
    An authorised officer's recorded action or finding against a Risk Case.
    Actions are the primary mechanism for the investigation workbench.
    """
    action_id: str
    case_id: str
    work_id: str
    action_type: ActionType
    action_status: ActionStatus = ActionStatus.PENDING
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    notes: Optional[str] = None
    finding: Optional[str] = None
    action_date: Optional[str] = None
    updated_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Layer 6 — Audit + Outcome History
# ---------------------------------------------------------------------------

@dataclass
class AuditEvent:
    """
    A traceable record of significant system or user activity.
    Every state-changing operation should emit an AuditEvent.
    """
    audit_id: str
    event_type: str
    entity_type: str
    entity_id: str
    description: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[str] = None


@dataclass
class AnalysisRunRecord:
    """
    A reproducible execution of the analysis pipeline.
    Links all signals, risk cases, and evidence to a specific data snapshot.
    """
    run_id: str
    dataset_hash: str
    timestamp: str
    rules_version: str
    detector_versions: Dict[str, str]
    project_count: int
    anomaly_count: int
    risk_distribution: Dict[str, int]
