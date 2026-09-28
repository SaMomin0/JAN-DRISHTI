"""
Unit and integration tests for Phase 2 domain detectors.
"""

import sqlite3
import pytest
from backend.pipeline.detectors.cost_detector import CostAnomalyDetector
from backend.pipeline.detectors.delay_detector import DelayAnomalyDetector
from backend.pipeline.detectors.expenditure_detector import ExpenditureDetector
from backend.pipeline.detectors.duplicate_detector import DuplicateWorkDetector
from backend.pipeline.detectors.cross_dataset_detector import CrossDatasetDetector
from backend.pipeline.detectors.data_quality_detector import DataQualityDetector
from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
from backend.pipeline.indicators import build_views

@pytest.fixture
def mock_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)

    cur = conn.cursor()
    # Insert test MP
    cur.execute("INSERT INTO mp (mp_id, mp_key, mp_name, state, constituency) VALUES (1, 'mp_1', 'Test MP', 'Delhi', 'South Delhi');")

    # Insert test works
    cur.execute("""
    INSERT INTO work (work_id, mp_id, mp_name, state, constituency, work_category, work, sanction_amount, sanction_date, work_status)
    VALUES
    ('W001', 1, 'Test MP', 'Delhi', 'South Delhi', 'Roads', 'Construction of CC Road in Ward 5', 100000, '2023-01-01', 'Sanction'),
    ('W002', 1, 'Test MP', 'Delhi', 'South Delhi', 'Roads', 'Construction of CC Road in Ward 5', 100000, '2023-01-01', 'Sanction'),
    ('W003', 1, 'Test MP', 'Delhi', 'South Delhi', 'Roads', 'Minor drain repair work', 1500000, '2022-01-01', 'Work Completed');
    """)

    # Insert test expenditure
    cur.execute("""
    INSERT INTO expenditure_transaction (work_id, expenditure_date, vendor_name, payment_status, fund_disbursed_amount)
    VALUES
    ('W001', '2023-08-01', 'ABC Infra', 'Payment Completed', 120000),
    ('W003', '2022-03-01', 'XYZ Ltd', 'Payment In-Progress', 100000);
    """)

    # Insert test completion
    cur.execute("""
    INSERT INTO completion (work_id, completion_date, amount_disbursed)
    VALUES
    ('W001', '2022-12-01', 120000);
    """)

    conn.commit()
    build_views(conn)
    yield conn
    conn.close()

def test_cost_anomaly_detector(mock_db):
    detector = CostAnomalyDetector()
    results = detector.detect(mock_db)
    assert isinstance(results, list)
    w3_anoms = [r for r in results if r.project_id == "W003"]
    assert len(w3_anoms) >= 1
    assert w3_anoms[0].anomaly_type == "COST_ANOMALY"

def test_delay_anomaly_detector(mock_db):
    detector = DelayAnomalyDetector()
    results = detector.detect(mock_db)
    assert isinstance(results, list)
    w1_delays = [r for r in results if r.project_id == "W001"]
    assert len(w1_delays) >= 1
    assert w1_delays[0].anomaly_type == "SANCTION_TO_EXPENDITURE_DELAY"

def test_expenditure_detector(mock_db):
    detector = ExpenditureDetector()
    results = detector.detect(mock_db)
    assert isinstance(results, list)
    exceeds = [r for r in results if r.anomaly_type == "EXPENDITURE_EXCEEDS_SANCTION"]
    assert len(exceeds) >= 1
    assert exceeds[0].project_id == "W001"

def test_duplicate_work_detector(mock_db):
    detector = DuplicateWorkDetector(similarity_threshold=0.80)
    results = detector.detect(mock_db)
    assert isinstance(results, list)
    dups = [r for r in results if r.anomaly_type == "DUPLICATE_WORK_CANDIDATE"]
    assert len(dups) >= 1

def test_cross_dataset_detector(mock_db):
    detector = CrossDatasetDetector()
    results = detector.detect(mock_db)
    assert isinstance(results, list)

def test_data_quality_detector(mock_db):
    detector = DataQualityDetector()
    results = detector.detect(mock_db)
    assert isinstance(results, list)
    dq_dates = [r for r in results if r.anomaly_type == "INVALID_DATE_SEQUENCE"]
    assert len(dq_dates) >= 1
    assert dq_dates[0].project_id == "W001"
