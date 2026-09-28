"""
Layer 4 — Risk Case and Evidence Graph Router.
Primary investigation objects connecting signals, traceable evidence, peer context,
and officer verification workflows.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.risk_case import (
    RiskCaseListItem,
    RiskCaseDetail,
    RiskCaseStatusUpdate,
    RiskCaseCreate,
    RiskCaseEvidenceItem
)
from backend.app.routers.audit import log_audit_event

router = APIRouter(prefix="/api/v1/risk-cases", tags=["Risk Cases"])


@router.get("", response_model=PaginatedResponse[RiskCaseListItem])
def list_risk_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter: OPEN, UNDER_REVIEW, VERIFIED, CLOSED, ESCALATED"),
    priority: Optional[str] = Query(None, description="Filter: LOW, MEDIUM, HIGH, CRITICAL"),
    state: Optional[str] = Query(None, description="Filter by state"),
    work_id: Optional[str] = Query(None, description="Filter by specific work_id"),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve paginated risk cases with filters."""
    cur = db.cursor()
    where = ["1=1"]
    params: List[Any] = []
    
    if status:
        where.append("rc.case_status = ?")
        params.append(status.upper())
    if priority:
        where.append("rc.priority = ?")
        params.append(priority.upper())
    if work_id:
        where.append("rc.work_id = ?")
        params.append(work_id)
    if state:
        where.append("w.state = ?")
        params.append(state)
        
    where_sql = " AND ".join(where)
    
    # Count query
    cur.execute(f"""
        SELECT COUNT(*)
        FROM risk_case rc
        LEFT JOIN work w ON rc.work_id = w.work_id
        WHERE {where_sql};
    """, params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    query = f"""
        SELECT
            rc.case_id,
            rc.work_id,
            rc.run_id,
            rc.case_status,
            rc.priority,
            rc.signal_count,
            rc.evidence_count,
            rc.verification_recommendation,
            rc.created_at,
            rc.updated_at,
            w.mp_name,
            w.state,
            w.constituency,
            w.work_category,
            w.sanction_amount,
            w.work_status
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
        LIMIT ? OFFSET ?;
    """
    cur.execute(query, params + [page_size, offset])
    rows = cur.fetchall()
    
    items = [
        RiskCaseListItem(
            case_id=row["case_id"],
            work_id=row["work_id"],
            run_id=row["run_id"],
            case_status=row["case_status"],
            priority=row["priority"],
            signal_count=row["signal_count"] or 0,
            evidence_count=row["evidence_count"] or 0,
            verification_recommendation=row["verification_recommendation"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            mp_name=row["mp_name"],
            state=row["state"],
            constituency=row["constituency"],
            work_category=row["work_category"],
            sanction_amount=row["sanction_amount"],
            work_status=row["work_status"],
        )
        for row in rows
    ]
    
    total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 0
    return PaginatedResponse(
        data=items,
        pagination=PaginationMeta(
            total_records=total_records,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.get("/work/{work_id}", response_model=RiskCaseDetail)
def get_risk_case_by_work(
    work_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve the most recent risk case for a specific work."""
    cur = db.cursor()
    cur.execute("SELECT case_id FROM risk_case WHERE work_id = ? ORDER BY updated_at DESC LIMIT 1;", (work_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"No risk case found for work_id {work_id}")
    return get_risk_case_by_id(case_id=row["case_id"], db=db)


@router.get("/{case_id}", response_model=RiskCaseDetail)
def get_risk_case_by_id(
    case_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve detailed Risk Case including evidence graph and connected signals."""
    cur = db.cursor()
    cur.execute("""
        SELECT
            rc.case_id,
            rc.work_id,
            rc.run_id,
            rc.case_status,
            rc.priority,
            rc.signal_count,
            rc.evidence_count,
            rc.peer_context_json,
            rc.data_limitations_json,
            rc.verification_recommendation,
            rc.created_at,
            rc.updated_at,
            w.mp_name,
            w.state,
            w.constituency,
            w.work_category,
            w.sanction_amount,
            w.work_status
        FROM risk_case rc
        LEFT JOIN work w ON rc.work_id = w.work_id
        WHERE rc.case_id = ?;
    """, (case_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Risk case {case_id} not found")

    # Fetch evidence records
    cur.execute("""
        SELECT
            rc_evidence_id, case_id, evidence_id, anomaly_id,
            evidence_role, source_dataset, source_record_id,
            description, observed_value, comparison_value, created_at
        FROM risk_case_evidence
        WHERE case_id = ?
        ORDER BY created_at ASC;
    """, (case_id,))
    evidence_rows = cur.fetchall()
    evidence_items = [
        RiskCaseEvidenceItem(
            rc_evidence_id=e["rc_evidence_id"],
            case_id=e["case_id"],
            evidence_id=e["evidence_id"],
            anomaly_id=e["anomaly_id"],
            evidence_role=e["evidence_role"],
            source_dataset=e["source_dataset"],
            source_record_id=e["source_record_id"],
            description=e["description"],
            observed_value=e["observed_value"],
            comparison_value=e["comparison_value"],
            created_at=e["created_at"],
        )
        for e in evidence_rows
    ]

    # Fetch related anomalies/signals for this work
    cur.execute("""
        SELECT anomaly_id, detector_name, anomaly_type, severity, score, confidence, reason, created_at
        FROM project_anomaly
        WHERE work_id = ?
        ORDER BY score DESC;
    """, (row["work_id"],))
    anomaly_rows = cur.fetchall()
    signals = [dict(a) for a in anomaly_rows]

    # If no anomalies found in project_anomaly, check ai_signal table
    if not signals:
        cur.execute("""
            SELECT signal_id, signal_type, severity, reason, supporting_value, threshold_value, created_at
            FROM ai_signal
            WHERE entity_id = ?
            ORDER BY signal_id ASC;
        """, (row["work_id"],))
        sig_rows = cur.fetchall()
        signals = [dict(s) for s in sig_rows]

    peer_context = None
    if row["peer_context_json"]:
        try:
            peer_context = json.loads(row["peer_context_json"])
        except Exception:
            pass

    data_limitations = None
    if row["data_limitations_json"]:
        try:
            data_limitations = json.loads(row["data_limitations_json"])
        except Exception:
            pass

    return RiskCaseDetail(
        case_id=row["case_id"],
        work_id=row["work_id"],
        run_id=row["run_id"],
        case_status=row["case_status"],
        priority=row["priority"],
        signal_count=row["signal_count"] or len(signals),
        evidence_count=row["evidence_count"] or len(evidence_items),
        peer_context=peer_context,
        data_limitations=data_limitations,
        verification_recommendation=row["verification_recommendation"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        mp_name=row["mp_name"],
        state=row["state"],
        constituency=row["constituency"],
        work_category=row["work_category"],
        sanction_amount=row["sanction_amount"],
        work_status=row["work_status"],
        evidence=evidence_items,
        signals=signals,
    )


@router.post("", response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
def create_risk_case(
    payload: RiskCaseCreate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Manually or programmatically initiate a Risk Case for a project."""
    cur = db.cursor()
    # Verify work exists
    cur.execute("SELECT work_id FROM work WHERE work_id = ?;", (payload.work_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail=f"Work record {payload.work_id} not found")

    case_id = f"case_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Count existing signals for this work
    cur.execute("SELECT COUNT(*) FROM project_anomaly WHERE work_id = ?;", (payload.work_id,))
    sig_count = cur.fetchone()[0]
    if sig_count == 0:
        cur.execute("SELECT COUNT(*) FROM ai_signal WHERE entity_id = ?;", (payload.work_id,))
        sig_count = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO risk_case (
            case_id, work_id, run_id, case_status, priority,
            signal_count, evidence_count, verification_recommendation,
            created_at, updated_at
        ) VALUES (?, ?, ?, 'OPEN', ?, ?, 0, ?, ?, ?)
    """, (
        case_id, payload.work_id, payload.run_id,
        payload.priority or "MEDIUM", sig_count,
        payload.verification_recommendation or "Initial case created for officer review.",
        now, now
    ))
    db.commit()

    log_audit_event(
        db=db,
        event_type="CASE_CREATED",
        entity_type="RISK_CASE",
        entity_id=case_id,
        description=f"Risk case created for work {payload.work_id} with priority {payload.priority}",
        metadata={"work_id": payload.work_id, "priority": payload.priority}
    )

    return {"status": "success", "case_id": case_id, "work_id": payload.work_id}


@router.patch("/{case_id}/status", response_model=Dict[str, str])
def update_risk_case_status(
    case_id: str,
    payload: RiskCaseStatusUpdate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Update risk case lifecycle status (OPEN, UNDER_REVIEW, VERIFIED, CLOSED, ESCALATED)."""
    valid_statuses = {"OPEN", "UNDER_REVIEW", "VERIFIED", "CLOSED", "ESCALATED"}
    target_status = payload.case_status.upper()
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {sorted(valid_statuses)}")

    cur = db.cursor()
    cur.execute("SELECT case_status, work_id FROM risk_case WHERE case_id = ?;", (case_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Risk case {case_id} not found")

    old_status = row["case_status"]
    now = datetime.now(timezone.utc).isoformat()

    cur.execute("UPDATE risk_case SET case_status = ?, updated_at = ? WHERE case_id = ?;", (target_status, now, case_id))
    db.commit()

    log_audit_event(
        db=db,
        event_type="CASE_STATUS_CHANGED",
        entity_type="RISK_CASE",
        entity_id=case_id,
        actor_id=payload.actor_id,
        actor_name=payload.actor_name,
        description=f"Status changed from {old_status} to {target_status}. Notes: {payload.notes or 'None'}",
        metadata={"old_status": old_status, "new_status": target_status, "notes": payload.notes}
    )

    return {"status": "success", "case_id": case_id, "old_status": old_status, "new_status": target_status}


@router.get("/{case_id}/evidence", response_model=List[RiskCaseEvidenceItem])
def get_case_evidence(
    case_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """List all evidence linked to a risk case."""
    cur = db.cursor()
    cur.execute("""
        SELECT
            rc_evidence_id, case_id, evidence_id, anomaly_id,
            evidence_role, source_dataset, source_record_id,
            description, observed_value, comparison_value, created_at
        FROM risk_case_evidence
        WHERE case_id = ?
        ORDER BY created_at ASC;
    """, (case_id,))
    rows = cur.fetchall()
    return [
        RiskCaseEvidenceItem(
            rc_evidence_id=e["rc_evidence_id"],
            case_id=e["case_id"],
            evidence_id=e["evidence_id"],
            anomaly_id=e["anomaly_id"],
            evidence_role=e["evidence_role"],
            source_dataset=e["source_dataset"],
            source_record_id=e["source_record_id"],
            description=e["description"],
            observed_value=e["observed_value"],
            comparison_value=e["comparison_value"],
            created_at=e["created_at"],
        )
        for e in rows
    ]


@router.get("/{case_id}/signals", response_model=List[Dict[str, Any]])
def get_case_signals(
    case_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """List signals connected to the work record for this risk case."""
    cur = db.cursor()
    cur.execute("SELECT work_id FROM risk_case WHERE case_id = ?;", (case_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Risk case {case_id} not found")

    work_id = row["work_id"]
    cur.execute("""
        SELECT anomaly_id, detector_name, anomaly_type, severity, score, confidence, reason, created_at
        FROM project_anomaly
        WHERE work_id = ?
        ORDER BY score DESC;
    """, (work_id,))
    rows = cur.fetchall()
    if rows:
        return [dict(r) for r in rows]

    cur.execute("""
        SELECT signal_id, signal_type, severity, reason, supporting_value, threshold_value, created_at
        FROM ai_signal
        WHERE entity_id = ?
        ORDER BY signal_id ASC;
    """, (work_id,))
    return [dict(r) for r in cur.fetchall()]
