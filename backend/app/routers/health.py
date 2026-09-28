from datetime import datetime
from fastapi import APIRouter, status, Response
from backend.app.config import settings
from backend.database.connection import check_database_health
from backend.app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Liveness probe: verifies the API server is responding."""
    db_health = check_database_health()
    return {
        "status": "ok" if db_health.get("ready") else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_health
    }

@router.get("/ready")
def get_ready(response: Response):
    """Readiness probe: verifies database is fully connected and ready for queries."""
    db_health = check_database_health()
    if not db_health.get("ready"):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "ready": False,
            "status": "unready",
            "detail": db_health.get("message", "Database not ready")
        }
    return {
        "ready": True,
        "status": "ready",
        "work_records": db_health.get("work_records"),
        "tables_count": db_health.get("tables_count")
    }
