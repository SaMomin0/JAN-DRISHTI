"""
API Tests for Phase 2 Endpoints.
"""

import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.database.connection import get_db
from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
from backend.pipeline.indicators import build_views
from backend.pipeline.runner import persist_analysis_run
from backend.pipeline.risk_engine import ExplainableRiskEngine

@pytest.fixture
def mock_db():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)
    cur = conn.cursor()
    cur.execute("INSERT INTO mp (mp_id, mp_key, mp_name, state, constituency, allocated_amount) VALUES (1, 'mp_1', 'Test MP', 'Delhi', 'South Delhi', 5000000);")
    cur.execute("""
    INSERT INTO work (work_id, mp_id, mp_name, state, constituency, work_category, work, sanction_amount, sanction_date, work_status)
    VALUES ('W1', 1, 'Test MP', 'Delhi', 'South Delhi', 'Roads', 'Road 1', 100000, '2023-01-01', 'Sanction');
    """)
    conn.commit()
    build_views(conn)
    
    # Pre-populate run
    engine = ExplainableRiskEngine()
    persist_analysis_run(conn, engine)
    
    yield conn
    conn.close()

@pytest.fixture
def client(mock_db):
    def override_get_db():
        try:
            yield mock_db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_get_project_risk_api(client):
    res = client.get("/api/v1/projects/W1/risk")
    assert res.status_code == 200
    data = res.json()
    assert data["work_id"] == "W1"
    assert "risk_score" in data
    assert "risk_level" in data
    assert "confidence" in data

def test_get_project_anomalies_api(client):
    res = client.get("/api/v1/projects/W1/anomalies")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_project_evidence_api(client):
    res = client.get("/api/v1/projects/W1/evidence")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_project_comparables_api(client):
    res = client.get("/api/v1/projects/W1/comparables")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_project_history_api(client):
    res = client.get("/api/v1/projects/W1/history")
    assert res.status_code == 200
    data = res.json()
    assert data["work_id"] == "W1"

def test_risk_distribution_api(client):
    res = client.get("/api/v1/risk/distribution")
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert "distribution" in data

def test_risk_factors_api(client):
    res = client.get("/api/v1/risk/factors")
    assert res.status_code == 200
    data = res.json()
    assert "factor_weights" in data

def test_analysis_runs_api(client):
    res = client.get("/api/v1/analysis-runs")
    assert res.status_code == 200
    assert len(res.json()) >= 1
