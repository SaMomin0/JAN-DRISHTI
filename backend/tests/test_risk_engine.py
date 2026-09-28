"""
Unit tests for Explainable AI Risk Engine.
"""

import sqlite3
import pytest
from backend.pipeline.risk_engine import ExplainableRiskEngine, RiskEngineConfig
from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
from backend.pipeline.indicators import build_views

@pytest.fixture
def mock_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)
    cur = conn.cursor()
    cur.execute("INSERT INTO mp (mp_id, mp_key, mp_name, state, constituency, allocated_amount) VALUES (1, 'mp_1', 'Test MP', 'Delhi', 'South Delhi', 5000000);")
    cur.execute("""
    INSERT INTO work (work_id, mp_id, mp_name, state, constituency, work_category, work, sanction_amount, sanction_date, work_status)
    VALUES
    ('W100', 1, 'Test MP', 'Delhi', 'South Delhi', 'Roads', 'Road work 1', 100000, '2023-01-01', 'Sanction'),
    ('W200', 1, 'Test MP', 'Delhi', 'South Delhi', 'Water', 'Water pipe line', 500000, '2021-01-01', 'Sanction');
    """)
    cur.execute("INSERT INTO expenditure_transaction (work_id, expenditure_date, vendor_name, payment_status, fund_disbursed_amount) VALUES ('W100', '2023-09-01', 'V1', 'Payment Completed', 150000);")
    conn.commit()
    build_views(conn)
    yield conn
    conn.close()

def test_explainable_risk_engine_evaluation(mock_db):
    engine = ExplainableRiskEngine()
    profiles = engine.evaluate_all_works(mock_db)
    assert len(profiles) == 2
    w100 = next(p for p in profiles if p.work_id == "W100")
    assert w100.risk_score > 0
    assert w100.risk_level in ["LOW", "MEDIUM", "HIGH"]
    assert 0.0 <= w100.confidence <= 1.0
    assert isinstance(w100.factor_scores, dict)
    assert isinstance(w100.explanations, list)

def test_risk_engine_custom_config():
    config = RiskEngineConfig(weights={"cost": 0.5, "delay": 0.5, "expenditure": 0.0, "cross_dataset": 0.0, "duplicate": 0.0, "data_quality": 0.0})
    engine = ExplainableRiskEngine(config=config)
    assert engine.config.weights["cost"] == 0.5
