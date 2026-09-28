from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "healthy"]
    assert "database" in data

def test_ready_endpoint():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True

def test_projects_endpoint():
    response = client.get("/api/v1/projects?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) == 5
    assert data["pagination"]["total_records"] > 0

def test_project_detail_endpoint():
    # Fetch first project
    list_resp = client.get("/api/v1/projects?page_size=1")
    first_id = list_resp.json()["data"][0]["work_id"]
    
    response = client.get(f"/api/v1/projects/{first_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["work_id"] == first_id
    assert "transactions" in data
    assert "signals" in data

def test_statistics_endpoint():
    response = client.get("/api/v1/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "financial_overview" in data
    assert data["financial_overview"]["total_works"] > 0
    assert "top_mps_by_expenditure" in data
    assert len(data["top_mps_by_expenditure"]) > 0

def test_analysis_runs_endpoint():
    response = client.get("/api/v1/analysis-runs")
    assert response.status_code == 200
    runs = response.json()
    assert len(runs) > 0
    assert "run_id" in runs[0] or "analysis_run_id" in runs[0]

def test_anomalies_endpoint():
    response = client.get("/api/v1/anomalies?page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) > 0

def test_monitoring_indicators():
    resp_works = client.get("/api/v1/monitoring-indicators/works?page_size=5")
    assert resp_works.status_code == 200
    assert len(resp_works.json()["data"]) == 5
    
    resp_mps = client.get("/api/v1/monitoring-indicators/mps?page_size=5")
    assert resp_mps.status_code == 200
    assert len(resp_mps.json()["data"]) == 5

def test_ai_signals_endpoint():
    response = client.get("/api/v1/ai-signals?page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 5
