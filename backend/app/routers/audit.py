"""
Layer 6 — Audit and Outcome History Router.
Provides traceable history of system actions, officer decisions, and state transitions.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from backend.database.connection import get_db
from backend.app.schemas.common import PaginatedResponse, PaginationMeta
from backend.app.schemas.audit import AuditLogResponse, AuditEventCreate

router = APIRouter(prefix="/api/v1/audit", tags=["Audit & History"])


def log_audit_event(
    db: sqlite3.Connection,
    event_type: str,
    entity_type: str,
    entity_id: str,
    description: str,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Helper to append an audit entry to the canonical audit_log table.
    Can be used by routers and service pipelines.
    """
    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    meta_json = json.dumps(metadata or {})
    
    cur = db.cursor()
    cur.execute("""
        INSERT INTO audit_log (
            audit_id, event_type, entity_type, entity_id,
            actor_id, actor_name, description, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        audit_id, event_type, entity_type, entity_id,
        actor_id, actor_name, description, meta_json, now
    ))
    db.commit()
    return audit_id


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. RISK_CASE, VERIFICATION_ACTION)"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve paginated audit trail events."""
    cur = db.cursor()
    where = ["1=1"]
    params: List[Any] = []
    
    if event_type:
        where.append("event_type = ?")
        params.append(event_type)
    if entity_type:
        where.append("entity_type = ?")
        params.append(entity_type)
    if entity_id:
        where.append("entity_id = ?")
        params.append(entity_id)
        
    where_sql = " AND ".join(where)
    
    cur.execute(f"SELECT COUNT(*) FROM audit_log WHERE {where_sql};", params)
    total_records = cur.fetchone()[0]
    
    offset = (page - 1) * page_size
    cur.execute(f"""
        SELECT audit_id, event_type, entity_type, entity_id,
               actor_id, actor_name, description, metadata_json, created_at
        FROM audit_log
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    """, params + [page_size, offset])
    
    rows = cur.fetchall()
    items = [
        AuditLogResponse(
            audit_id=row["audit_id"],
            event_type=row["event_type"],
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            actor_id=row["actor_id"],
            actor_name=row["actor_name"],
            description=row["description"],
            metadata_json=row["metadata_json"],
            created_at=row["created_at"],
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


@router.get("/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
def get_entity_audit_trail(
    entity_type: str,
    entity_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Retrieve full audit history for a specific entity."""
    cur = db.cursor()
    cur.execute("""
        SELECT audit_id, event_type, entity_type, entity_id,
               actor_id, actor_name, description, metadata_json, created_at
        FROM audit_log
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY created_at DESC;
    """, (entity_type.upper(), entity_id))
    
    rows = cur.fetchall()
    return [
        AuditLogResponse(
            audit_id=row["audit_id"],
            event_type=row["event_type"],
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            actor_id=row["actor_id"],
            actor_name=row["actor_name"],
            description=row["description"],
            metadata_json=row["metadata_json"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.post("", response_model=Dict[str, str], status_code=201)
def create_audit_event(
    event: AuditEventCreate,
    db: sqlite3.Connection = Depends(get_db)
):
    """Record a new audit event."""
    audit_id = log_audit_event(
        db=db,
        event_type=event.event_type,
        entity_type=event.entity_type,
        entity_id=event.entity_id,
        description=event.description,
        actor_id=event.actor_id,
        actor_name=event.actor_name,
        metadata=event.metadata
    )
    return {"status": "success", "audit_id": audit_id}
