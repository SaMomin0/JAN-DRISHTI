import os
from pathlib import Path
from typing import List

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # SIH_2026-main

def _get_env(key: str, default: str) -> str:
    return os.getenv(key, default)

class Settings:
    PROJECT_NAME: str = "MPLADS Intelligence Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = _get_env("ENVIRONMENT", "development")
    LOG_LEVEL: str = _get_env("LOG_LEVEL", "INFO")
    
    # Server
    API_HOST: str = _get_env("API_HOST", "0.0.0.0")
    API_PORT: int = int(_get_env("API_PORT", "8000"))
    
    # Data & Database Paths
    BASE_DIR: Path = BASE_DIR
    DATA_RAW_DIR: Path = Path(_get_env("DATA_RAW_DIR", str(BASE_DIR)))
    DATA_CLEANED_DIR: Path = Path(_get_env("DATA_CLEANED_DIR", str(BASE_DIR / "cleaned")))
    DATA_ANALYSIS_DIR: Path = Path(_get_env("DATA_ANALYSIS_DIR", str(BASE_DIR / "analysis")))
    DATABASE_PATH: Path = Path(_get_env("DATABASE_PATH", str(BASE_DIR / "database" / "mplads.db")))
    
    DATABASE_URL: str = _get_env("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
