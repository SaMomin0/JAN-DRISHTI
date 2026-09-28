"""
Corroboration + Explainability Layer (Layer 3).

Establishes the canonical interface for signal aggregation, peer comparison,
supporting/counter-evidence assembly, and explainable prioritization.

Phase 1 scope: Interface defined. Basic aggregation implemented.
Phase 2 scope: Statistical corroboration, ML-based peer ranking, LLM summaries.

Core principle: A signal is not a verdict. Corroboration determines whether
multiple independent signals converge on the same project — making it worthy
of investigation. A single low-confidence signal should NOT create a risk case.
"""

import sqlite3
import json
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

from backend.domain.models import (
    Signal, SignalType, SignalSeverity,
    PeerContext, DataLimitation, CorroborationResult,
    RiskCase, RiskCaseStatus, Evidence
)
from backend.pipeline.signals import ANOMALY_TYPE_TO_SIGNAL_TYPE


# ---------------------------------------------------------------------------
# Corroboration Engine
# ---------------------------------------------------------------------------

class CorroborationEngine:
    """
    Aggregates signals for a project and determines whether investigation is warranted.

    Phase 1 implementation:
      - Counts signals by type
      - Classifies convergence (multiple signal types = stronger case)
      - Sets priority based on composite signal score
      - Generates simple explainability notes

    Phase 2 enhancements:
      - Peer comparison statistical significance
      - Counter-evidence detection
      - LLM-generated natural language summaries
    """

    # Minimum score thresholds for priority classification
    PRIORITY_THRESHOLDS = {
        "CRITICAL": 75.0,
        "HIGH": 50.0,
        "MEDIUM": 25.0,
        "LOW": 0.0,
    }

    def corroborate(
        self,
        work_id: str,
        signals: List[Signal],
        peer_context: Optional[PeerContext] = None,
        data_limitations: Optional[List[DataLimitation]] = None,
    ) -> CorroborationResult:
        """
        Assemble a CorroborationResult from signals for one project.
        """
        if not signals:
            return CorroborationResult(
                work_id=work_id,
                composite_score=0.0,
                priority="LOW",
                investigation_recommendation=(
                    "No signals detected. No investigation warranted at this time."
                ),
                explainability_notes=["Zero signals detected across all detectors."]
            )

        # Group by signal type to detect convergence
        by_type: Dict[SignalType, List[Signal]] = {}
        for sig in signals:
            by_type.setdefault(sig.signal_type, []).append(sig)

        # Convergent = types with at least 1 signal; divergent = types absent
        convergent = signals
        distinct_signal_types = len(by_type)

        # Composite score: weighted average of top signal per type
        type_weights = {
            SignalType.COST_ANOMALY: 0.25,
            SignalType.DELAY_DEVIATION: 0.20,
            SignalType.PAYMENT_PATTERN: 0.25,
            SignalType.SIMILAR_WORK: 0.15,
            SignalType.PROGRESS_MISMATCH: 0.15,
        }
        composite = 0.0
        for stype, sigs in by_type.items():
            best_score = max(s.score for s in sigs)
            weight = type_weights.get(stype, 0.10)
            composite += best_score * weight

        composite = min(round(composite, 1), 100.0)

        # Priority classification
        priority = "LOW"
        for level in ["CRITICAL", "HIGH", "MEDIUM"]:
            if composite >= self.PRIORITY_THRESHOLDS[level]:
                priority = level
                break

        # Explainability notes
        notes = []
        for stype, sigs in by_type.items():
            best = max(sigs, key=lambda s: s.score)
            notes.append(
                f"[{stype.value}] {len(sigs)} signal(s), highest score {best.score:.1f}/100: {best.reason}"
            )

        if distinct_signal_types >= 3:
            notes.append(
                f"Signal convergence detected: {distinct_signal_types} independent signal types "
                f"triggered for this project — strengthening the case for investigation."
            )

        # Investigation recommendation
        if priority in ("CRITICAL", "HIGH"):
            recommendation = (
                f"Priority investigation recommended. {distinct_signal_types} independent signal "
                f"type(s) detected with composite score {composite}/100. "
                f"Officer review and field verification advised."
            )
        elif priority == "MEDIUM":
            recommendation = (
                f"Document review recommended. {distinct_signal_types} signal type(s) detected "
                f"with composite score {composite}/100. Officer note required."
            )
        else:
            recommendation = (
                f"Monitoring only. Composite score {composite}/100. "
                f"Re-evaluate on next analysis run."
            )

        return CorroborationResult(
            work_id=work_id,
            convergent_signals=convergent,
            divergent_signals=[],
            peer_context=peer_context,
            data_limitations=data_limitations or [],
            composite_score=composite,
            priority=priority,
            investigation_recommendation=recommendation,
            explainability_notes=notes,
        )


# ---------------------------------------------------------------------------
# Risk Case Factory
# ---------------------------------------------------------------------------

class RiskCaseFactory:
    """
    Creates RiskCase domain objects from CorroborationResults.
    Phase 1: Creates cases for HIGH and CRITICAL priority projects.
    Phase 2: Configurable thresholds, automatic evidence linking.
    """

    CASE_CREATION_THRESHOLD = "MEDIUM"   # Create cases for MEDIUM and above

    def should_create_case(self, result: CorroborationResult) -> bool:
        """Determine if this corroboration result warrants a Risk Case."""
        priority_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        threshold_rank = priority_rank.get(self.CASE_CREATION_THRESHOLD, 1)
        return priority_rank.get(result.priority, 0) >= threshold_rank

    def create_from_corroboration(
        self,
        result: CorroborationResult,
        run_id: Optional[str],
        case_id: str,
        timestamp: str,
    ) -> RiskCase:
        """Build a RiskCase from a CorroborationResult."""
        return RiskCase(
            case_id=case_id,
            work_id=result.work_id,
            run_id=run_id,
            case_status=RiskCaseStatus.OPEN,
            priority=result.priority,
            signals=result.convergent_signals,
            supporting_evidence=[],
            counter_evidence=[],
            peer_context=result.peer_context,
            data_limitations=result.data_limitations,
            verification_recommendation=result.investigation_recommendation,
            signal_count=len(result.convergent_signals),
            evidence_count=0,
            created_at=timestamp,
            updated_at=timestamp,
        )


# ---------------------------------------------------------------------------
# Risk Case Repository
# ---------------------------------------------------------------------------

class RiskCaseRepository:
    """
    Persistence layer for Risk Cases.
    Reads and writes to the canonical `risk_case` and `risk_case_evidence` tables.
    """

    def save(self, conn: sqlite3.Connection, case: RiskCase) -> None:
        """Persist a RiskCase to the database."""
        cur = conn.cursor()
        peer_context_json = json.dumps(
            {
                "comparison_group": case.peer_context.comparison_group,
                "peer_count": case.peer_context.peer_count,
                "mean_value": case.peer_context.mean_value,
            }
            if case.peer_context else {}
        )
        limitations_json = json.dumps(
            [{"type": d.limitation_type, "description": d.description} for d in case.data_limitations]
        )
        cur.execute("""
        INSERT OR REPLACE INTO risk_case (
            case_id, work_id, run_id, case_status, priority,
            signal_count, evidence_count, peer_context_json,
            data_limitations_json, verification_recommendation,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case.case_id, case.work_id, case.run_id,
            case.case_status.value if hasattr(case.case_status, 'value') else case.case_status,
            case.priority, case.signal_count, case.evidence_count,
            peer_context_json, limitations_json,
            case.verification_recommendation,
            case.created_at, case.updated_at,
        ))

    def get_by_work_id(self, conn: sqlite3.Connection, work_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the most recent risk case for a work_id."""
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
        SELECT * FROM risk_case
        WHERE work_id = ?
        ORDER BY updated_at DESC LIMIT 1
        """, (work_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    def get_by_case_id(self, conn: sqlite3.Connection, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific risk case by ID."""
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM risk_case WHERE case_id = ?", (case_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    def list_cases(
        self,
        conn: sqlite3.Connection,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """List risk cases with optional filters. Returns (cases, total_count)."""
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        where = ["1=1"]
        params: List[Any] = []
        if status:
            where.append("case_status = ?")
            params.append(status)
        if priority:
            where.append("priority = ?")
            params.append(priority)

        where_sql = " AND ".join(where)
        cur.execute(f"SELECT COUNT(*) FROM risk_case WHERE {where_sql}", params)
        total = cur.fetchone()[0]

        cur.execute(f"""
        SELECT rc.*, w.mp_name, w.state, w.constituency, w.work_category,
               w.sanction_amount, w.work_status
        FROM risk_case rc
        LEFT JOIN work w ON rc.work_id = w.work_id
        WHERE {where_sql}
        ORDER BY
            CASE rc.priority
                WHEN 'CRITICAL' THEN 0
                WHEN 'HIGH' THEN 1
                WHEN 'MEDIUM' THEN 2
                ELSE 3
            END ASC,
            rc.updated_at DESC
        LIMIT ? OFFSET ?
        """, params + [limit, offset])

        rows = cur.fetchall()
        return [dict(r) for r in rows], total

    def update_status(
        self,
        conn: sqlite3.Connection,
        case_id: str,
        new_status: str,
        updated_at: str,
    ) -> None:
        """Update case_status for a risk case."""
        cur = conn.cursor()
        cur.execute("""
        UPDATE risk_case SET case_status = ?, updated_at = ?
        WHERE case_id = ?
        """, (new_status, updated_at, case_id))
