import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator
from backend.app.config import settings

def get_sqlite_path() -> Path:
    if settings.DATABASE_URL.startswith("sqlite:///"):
        path_str = settings.DATABASE_URL.replace("sqlite:///", "")
        return Path(path_str)
    return settings.DATABASE_PATH

def create_connection() -> sqlite3.Connection:
    db_path = get_sqlite_path()
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)
    return conn

@contextmanager
def get_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency for database connection."""
    with get_connection() as conn:
        yield conn

def check_database_health() -> dict:
    """Check database existence, tables, and quick health metric."""
    db_path = get_sqlite_path()
    if not db_path.exists():
        return {"status": "error", "message": f"Database file missing at {db_path}", "ready": False}
    
    try:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [r[0] for r in cur.fetchall()]
            
            required_tables = {"mp", "work", "expenditure_transaction", "completion", "calamity_consent"}
            missing = required_tables - set(tables)
            if missing:
                return {
                    "status": "degraded",
                    "message": f"Missing tables: {missing}",
                    "ready": False,
                    "tables": tables
                }
            
            cur.execute("SELECT COUNT(*) FROM work;")
            work_count = cur.fetchone()[0]
            
            return {
                "status": "healthy",
                "ready": True,
                "work_records": work_count,
                "tables_count": len(tables),
                "database_path": str(db_path)
            }
    except Exception as e:
        return {"status": "error", "message": str(e), "ready": False}
