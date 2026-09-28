import sys
from pathlib import Path

# Ensure project root directory is in sys.path so 'backend...' imports resolve
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.database.connection import check_database_health
from backend.app.routers import (
    health,
    projects,
    statistics,
    analysis_runs,
    anomalies,
    monitoring,
    ai_signals,
    risk_router,
    audit,
    risk_cases,
    verification,
)

# Logging configuration
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("mplads-backend")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.PROJECT_NAME, settings.VERSION)
    health_status = check_database_health()
    if health_status.get("ready"):
        logger.info("Connected to database successfully: %d works loaded", health_status.get("work_records", 0))
    else:
        logger.warning("Database warning on startup: %s", health_status.get("message"))
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production FastAPI Backend for SIH26102 MPLADS Intelligence & Anomaly Detection System",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(projects.router)
app.include_router(statistics.router)
app.include_router(analysis_runs.router)
app.include_router(anomalies.router)
app.include_router(monitoring.router)
app.include_router(ai_signals.router)
app.include_router(risk_router.router)
app.include_router(audit.router)
app.include_router(risk_cases.router)
app.include_router(verification.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "api_v1": {
            "projects": "/api/v1/projects",
            "statistics": "/api/v1/statistics",
            "analysis_runs": "/api/v1/analysis-runs",
            "anomalies": "/api/v1/anomalies",
            "monitoring_indicators": "/api/v1/monitoring-indicators/works",
            "ai_signals": "/api/v1/ai-signals",
            "risk_distribution": "/api/v1/risk/distribution",
            "risk_factors": "/api/v1/risk/factors"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
