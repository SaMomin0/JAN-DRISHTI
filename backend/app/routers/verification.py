"""
Layer 5 — Officer Investigation Workbench Router.
Allows authorized officers to schedule inspections, record findings, add notes,
and manage verification actions on Risk Cases.
"""

import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.verification import (
    VerificationActionCreate,
    VerificationActionUpdate,
    VerificationActionResponse
)
from backend.app.routers.audit import log_audit_event

router = APIRouter(prefix="/api/v1/verification", tags=["Officer Workbench"])


@router.get("/actions", response_model=PaginatedResponse[VerificationActionResponse])
def list_verification_actions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    case_id: Optional[str] = Query(None, description="Filter by case ID"),
    work_id: Optional[str] = Query(None, description="Filter by work ID"),
    officer_id: Optional[str] = Query(None, description="Filter by officer ID"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    action_status: Optional[str] = Query(None, description="Filter by action status"),
    db: sqlite3.Connection = Depends(get_db)
):
    """List verification actions across risk cases with pagination and filters."""
    cur = db.cursor()
    where = ["1=1"]
    params: List[Any] = []

    if case_id:
        where.append("case_id = ?")
        params.append(case_id)
    if work_id:
        where.append("work_id = ?")
        params.append(work_id)
    if officer_id:
        where.append("officer_id = ?")
        params.append(officer_id)
    if action_type:
        where.append("action_type = ?")
        params.append(action_type.upper())
    if action_status:
        where.append("action_status = ?")
        params.append(action_status.upper())

    where_sql = " AND ".join(where)

    cur.execute(f"SELECT COUNT(*) FROM verification_action WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]

    offset = (page - 1) * page_size
    cur.execute(f"""
        SELECT action_id, case_id, work_id, officer_id, officer_name,
               action_type, action_status, notes, finding, action_date, updated_at
        FROM verification_action
        WHERE {where_sql}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?;
    """, params + [page_size, offset])

    rows = cur.fetchall()
    items = [
        VerificationActionResponse(
            action_id=r["action_id"],
            case_id=r["case_id"],
            work_id=r["work_id"],
            officer_id=r["officer_id"],
            officer_name=r["officer_name"],
            action_type=r["action_type"],
            action_status=r["action_status"],
            notes=r["notes"],
            finding=r["finding"],
            action_date=r["action_date"],
            updated_at=r["updated_at"],
        )
        for r in rows
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


@router.get("/cases/{case_id}/actions", response_model=List[VerificationActionResponse])
def get_actions_by_case(
    case_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve all verification actions recorded for a given risk case."""
    cur = db.cursor()
    cur.execute("""
        SELECT action_id, case_id, work_id, officer_id, officer_name,
               action_type, action_status, notes, finding, action_date, updated_at
        FROM verification_action
        WHERE case_id = ?
        ORDER BY updated_at DESC;
    """, (case_id,))
    rows = cur.fetchall()
    return [
        VerificationActionResponse(
            action_id=r["action_id"],
            case_id=r["case_id"],
            work_id=r["work_id"],
            officer_id=r["officer_id"],
            officer_name=r["officer_name"],
            action_type=r["action_type"],
            action_status=r["action_status"],
            notes=r["notes"],
            finding=r["finding"],
            action_date=r["action_date"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.post("/actions", response_model=VerificationActionResponse, status_code=status.HTTP_201_CREATED)
def create_verification_action(
    payload: VerificationActionCreate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Record an officer action (inspection, review, note, escalation) against a Risk Case."""
    cur = db.cursor()
    # Verify case exists
    cur.execute("SELECT case_id, work_id FROM risk_case WHERE case_id = ?;", (payload.case_id,))
    case_row = cur.fetchone()
    if not case_row:
        raise HTTPException(status_code=404, detail=f"Risk case {payload.case_id} not found")

    action_id = f"act_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    action_type = payload.action_type.upper()
    action_status_val = (payload.action_status or "PENDING").upper()

    cur.execute("""
        INSERT INTO verification_action (
            action_id, case_id, work_id, officer_id, officer_name,
            action_type, action_status, notes, finding, action_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        action_id, payload.case_id, payload.work_id,
        payload.officer_id, payload.officer_name,
        action_type, action_status_val,
        payload.notes, payload.finding, now, now
    ))
    db.commit()

    log_audit_event(
        db=db,
        event_type="VERIFICATION_ADDED",
        entity_type="VERIFICATION_ACTION",
        entity_id=action_id,
        actor_id=payload.officer_id,
        actor_name=payload.officer_name,
        description=f"Action '{action_type}' recorded on case {payload.case_id}",
        metadata={"case_id": payload.case_id, "action_type": action_type}
    )

    return VerificationActionResponse(
        action_id=action_id,
        case_id=payload.case_id,
        work_id=payload.work_id,
        officer_id=payload.officer_id,
        officer_name=payload.officer_name,
        action_type=action_type,
        action_status=action_status_val,
        notes=payload.notes,
        finding=payload.finding,
        action_date=now,
        updated_at=now,
    )


@router.patch("/actions/{action_id}", response_model=VerificationActionResponse)
def update_verification_action(
    action_id: str,
    payload: VerificationActionUpdate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Update finding, notes, or status on an existing verification action."""
    cur = db.cursor()
    cur.execute("SELECT * FROM verification_action WHERE action_id = ?;", (action_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Verification action {action_id} not found")

    now = datetime.now(timezone.utc).isoformat()
    new_status = payload.action_status.upper() if payload.action_status else row["action_status"]
    new_notes = payload.notes if payload.notes is not None else row["notes"]
    new_finding = payload.finding if payload.finding is not None else row["finding"]
    new_officer_id = payload.officer_id if payload.officer_id is not None else row["officer_id"]
    new_officer_name = payload.officer_name if payload.officer_name is not None else row["officer_name"]

    cur.execute("""
        UPDATE verification_action
        SET action_status = ?, notes = ?, finding = ?, officer_id = ?, officer_name = ?, updated_at = ?
        WHERE action_id = ?;
    """, (new_status, new_notes, new_finding, new_officer_id, new_officer_name, now, action_id))
    db.commit()

    log_audit_event(
        db=db,
        event_type="VERIFICATION_UPDATED",
        entity_type="VERIFICATION_ACTION",
        entity_id=action_id,
        actor_id=new_officer_id,
        actor_name=new_officer_name,
        description=f"Action {action_id} updated to status {new_status}",
        metadata={"new_status": new_status, "case_id": row["case_id"]}
    )

    return VerificationActionResponse(
        action_id=action_id,
        case_id=row["case_id"],
        work_id=row["work_id"],
        officer_id=new_officer_id,
        officer_name=new_officer_name,
        action_type=row["action_type"],
        action_status=new_status,
        notes=new_notes,
        finding=new_finding,
        action_date=row["action_date"],
        updated_at=now,
    )
