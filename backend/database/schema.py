"""
Database Schema Definitions for MPLADS Platform.
Contains reproducible DDL for SQLite (primary) and PostgreSQL (reference).

Six-Layer Architecture — Canonical Table Map:
  Layer 1 — Data Foundation:      mp, work, expenditure_transaction, completion, calamity_consent
  Layer 2 — Signal Engine:        project_anomaly, project_evidence (written per analysis_run)
  Layer 3 — Corroboration:        risk_case (peer_context_json, data_limitations_json)
  Layer 4 — Risk Case + Evidence: risk_case, risk_case_evidence, project_anomaly, project_evidence
  Layer 5 — Investigation:        verification_action
  Layer 6 — Audit + History:      audit_log, analysis_run, project_risk
"""

TABLES_DDL_SQLITE = """
-- 1. MP Master Table
CREATE TABLE IF NOT EXISTS mp (
    mp_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mp_key TEXT UNIQUE NOT NULL,
    mp_name TEXT NOT NULL,
    state TEXT NOT NULL,
    constituency TEXT NOT NULL,
    allocated_amount REAL
);

-- 2. Work Master Table
CREATE TABLE IF NOT EXISTS work (
    work_id TEXT PRIMARY KEY,
    work_category TEXT,
    work TEXT,
    state TEXT,
    ida TEXT,
    mp_name TEXT,
    constituency TEXT,
    work_description TEXT,
    recommended_date TEXT,
    sanction_date TEXT,
    sanction_amount REAL,
    work_status TEXT,
    mp_key TEXT,
    mp_id INTEGER,
    FOREIGN KEY (mp_id) REFERENCES mp(mp_id)
);

-- 3. Expenditure Transactions Table
CREATE TABLE IF NOT EXISTS expenditure_transaction (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id TEXT NOT NULL,
    mp_key TEXT,
    mp_id INTEGER,
    state TEXT,
    ida TEXT,
    mp_name TEXT,
    constituency TEXT,
    expenditure_date TEXT,
    vendor_name TEXT,
    payment_status TEXT,
    fund_disbursed_amount REAL,
    FOREIGN KEY (work_id) REFERENCES work(work_id),
    FOREIGN KEY (mp_id) REFERENCES mp(mp_id)
);

-- 4. Completion Table
CREATE TABLE IF NOT EXISTS completion (
    completion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id TEXT UNIQUE NOT NULL,
    mp_key TEXT,
    mp_id INTEGER,
    state TEXT,
    ida TEXT,
    mp_name TEXT,
    constituency TEXT,
    work_description TEXT,
    completion_date TEXT,
    image TEXT,
    amount_disbursed REAL,
    FOREIGN KEY (work_id) REFERENCES work(work_id),
    FOREIGN KEY (mp_id) REFERENCES mp(mp_id)
);

-- 5. Calamity Consent Table
CREATE TABLE IF NOT EXISTS calamity_consent (
    consent_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mp_key TEXT,
    mp_id INTEGER,
    mp_name TEXT,
    calamity_type TEXT,
    calamity_name TEXT,
    consent_date TEXT,
    consent_amount REAL,
    FOREIGN KEY (mp_id) REFERENCES mp(mp_id)
);

-- 6. AI Signals Table
CREATE TABLE IF NOT EXISTS ai_signal (
    signal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    mp_name TEXT,
    state TEXT,
    constituency TEXT,
    severity TEXT NOT NULL,
    reason TEXT NOT NULL,
    supporting_value REAL,
    threshold_value REAL,
    created_at TEXT NOT NULL
);

-- 7. Analysis Runs Table (Layer 6)
CREATE TABLE IF NOT EXISTS analysis_run (
    run_id TEXT PRIMARY KEY,
    dataset_hash TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    rules_version TEXT NOT NULL,
    detector_versions TEXT NOT NULL,
    project_count INTEGER NOT NULL,
    anomaly_count INTEGER NOT NULL,
    risk_distribution_json TEXT NOT NULL
);

-- 8. Project Risk Table (Layer 2 output / Layer 6 history)
CREATE TABLE IF NOT EXISTS project_risk (
    work_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    risk_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    confidence REAL NOT NULL,
    factor_scores_json TEXT NOT NULL,
    explanation_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (work_id, run_id),
    FOREIGN KEY (work_id) REFERENCES work(work_id),
    FOREIGN KEY (run_id) REFERENCES analysis_run(run_id)
);

-- 9. Project Anomaly Table (Layer 2 — Signal persistence)
CREATE TABLE IF NOT EXISTS project_anomaly (
    anomaly_id TEXT PRIMARY KEY,
    work_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    detector_name TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    score REAL NOT NULL,
    confidence REAL NOT NULL,
    reason TEXT NOT NULL,
    comparison_group TEXT,
    comparison_statistics_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (work_id) REFERENCES work(work_id),
    FOREIGN KEY (run_id) REFERENCES analysis_run(run_id)
);

-- 10. Project Evidence Table (Layer 4 — Traceable evidence)
CREATE TABLE IF NOT EXISTS project_evidence (
    evidence_id TEXT PRIMARY KEY,
    anomaly_id TEXT NOT NULL,
    work_id TEXT NOT NULL,
    source_dataset TEXT NOT NULL,
    source_record_id TEXT,
    observed_value REAL,
    comparison_value REAL,
    difference_value REAL,
    evidence_json TEXT NOT NULL,
    FOREIGN KEY (anomaly_id) REFERENCES project_anomaly(anomaly_id),
    FOREIGN KEY (work_id) REFERENCES work(work_id)
);

-- 11. Risk Case Table (Layer 4)
-- A Risk Case is the primary investigation object connecting signals, evidence,
-- peer context, data limitations, and verification recommendations for one project.
-- case_status: OPEN | UNDER_REVIEW | VERIFIED | CLOSED | ESCALATED
-- priority: LOW | MEDIUM | HIGH | CRITICAL
CREATE TABLE IF NOT EXISTS risk_case (
    case_id TEXT PRIMARY KEY,
    work_id TEXT NOT NULL,
    run_id TEXT,
    case_status TEXT NOT NULL DEFAULT 'OPEN',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    signal_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    peer_context_json TEXT,
    data_limitations_json TEXT,
    verification_recommendation TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (work_id) REFERENCES work(work_id),
    FOREIGN KEY (run_id) REFERENCES analysis_run(run_id)
);

-- 12. Risk Case Evidence Relationships (Layer 4)
-- Links evidence records to risk cases with supporting/counter-evidence roles.
-- evidence_role: SUPPORTING | COUNTER | CONTEXTUAL
CREATE TABLE IF NOT EXISTS risk_case_evidence (
    rc_evidence_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    evidence_id TEXT,
    anomaly_id TEXT,
    evidence_role TEXT NOT NULL DEFAULT 'SUPPORTING',
    source_dataset TEXT NOT NULL,
    source_record_id TEXT,
    description TEXT NOT NULL,
    observed_value REAL,
    comparison_value REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES risk_case(case_id),
    FOREIGN KEY (evidence_id) REFERENCES project_evidence(evidence_id),
    FOREIGN KEY (anomaly_id) REFERENCES project_anomaly(anomaly_id)
);

-- 13. Verification Actions Table (Layer 5 — Officer Investigation Workbench)
-- Records authorised officer actions and findings against a risk case.
-- action_type: FIELD_INSPECTION | DOCUMENT_REVIEW | OFFICER_NOTE | ESCALATE | CLOSE
-- action_status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
CREATE TABLE IF NOT EXISTS verification_action (
    action_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    work_id TEXT NOT NULL,
    officer_id TEXT,
    officer_name TEXT,
    action_type TEXT NOT NULL,
    action_status TEXT NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    finding TEXT,
    action_date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES risk_case(case_id),
    FOREIGN KEY (work_id) REFERENCES work(work_id)
);

-- 14. Audit Log Table (Layer 6 — Traceable history)
-- event_type examples: CASE_CREATED | CASE_STATUS_CHANGED | VERIFICATION_ADDED |
--                      ANALYSIS_RUN_COMPLETED | SIGNAL_GENERATED | OFFICER_NOTE_ADDED
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL
);
"""

INDEXES_DDL_SQLITE = """
CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_key ON mp(mp_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_id ON work(work_id);
CREATE INDEX IF NOT EXISTS idx_work_mp_id ON work(mp_id);
CREATE INDEX IF NOT EXISTS idx_expenditure_work_id ON expenditure_transaction(work_id);
CREATE INDEX IF NOT EXISTS idx_expenditure_mp_id ON expenditure_transaction(mp_id);
CREATE INDEX IF NOT EXISTS idx_completion_work_id ON completion(work_id);
CREATE INDEX IF NOT EXISTS idx_completion_mp_id ON completion(mp_id);
CREATE INDEX IF NOT EXISTS idx_calamity_mp_id ON calamity_consent(mp_id);
CREATE INDEX IF NOT EXISTS idx_ai_signal_type ON ai_signal(signal_type);
CREATE INDEX IF NOT EXISTS idx_ai_signal_entity ON ai_signal(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_signal_severity ON ai_signal(severity);
CREATE INDEX IF NOT EXISTS idx_project_risk_work ON project_risk(work_id);
CREATE INDEX IF NOT EXISTS idx_project_risk_run ON project_risk(run_id);
CREATE INDEX IF NOT EXISTS idx_project_anomaly_work ON project_anomaly(work_id);
CREATE INDEX IF NOT EXISTS idx_project_anomaly_run ON project_anomaly(run_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_anomaly ON project_evidence(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_work ON project_evidence(work_id);
CREATE INDEX IF NOT EXISTS idx_risk_case_work ON risk_case(work_id);
CREATE INDEX IF NOT EXISTS idx_risk_case_status ON risk_case(case_status);
CREATE INDEX IF NOT EXISTS idx_risk_case_run ON risk_case(run_id);
CREATE INDEX IF NOT EXISTS idx_rc_evidence_case ON risk_case_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_rc_evidence_anomaly ON risk_case_evidence(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_verification_case ON verification_action(case_id);
CREATE INDEX IF NOT EXISTS idx_verification_work ON verification_action(work_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
"""

POSTGRESQL_DDL = """
-- PostgreSQL Canonical Schema for SIH26102 MPLADS Platform

CREATE TABLE IF NOT EXISTS mp (
    mp_id SERIAL PRIMARY KEY,
    mp_key VARCHAR(255) UNIQUE NOT NULL,
    mp_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    constituency VARCHAR(150) NOT NULL,
    allocated_amount NUMERIC(15, 2)
);

CREATE TABLE IF NOT EXISTS work (
    work_id VARCHAR(50) PRIMARY KEY,
    work_category VARCHAR(100),
    work TEXT,
    state VARCHAR(100),
    ida VARCHAR(255),
    mp_name VARCHAR(255),
    constituency VARCHAR(150),
    work_description TEXT,
    recommended_date DATE,
    sanction_date DATE,
    sanction_amount NUMERIC(15, 2),
    work_status VARCHAR(100),
    mp_key VARCHAR(255),
    mp_id INTEGER REFERENCES mp(mp_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenditure_transaction (
    transaction_id SERIAL PRIMARY KEY,
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id) ON DELETE CASCADE,
    mp_key VARCHAR(255),
    mp_id INTEGER REFERENCES mp(mp_id) ON DELETE SET NULL,
    state VARCHAR(100),
    ida VARCHAR(255),
    mp_name VARCHAR(255),
    constituency VARCHAR(150),
    expenditure_date DATE,
    vendor_name VARCHAR(255),
    payment_status VARCHAR(50),
    fund_disbursed_amount NUMERIC(15, 2)
);

CREATE TABLE IF NOT EXISTS completion (
    completion_id SERIAL PRIMARY KEY,
    work_id VARCHAR(50) UNIQUE NOT NULL REFERENCES work(work_id) ON DELETE CASCADE,
    mp_key VARCHAR(255),
    mp_id INTEGER REFERENCES mp(mp_id) ON DELETE SET NULL,
    state VARCHAR(100),
    ida VARCHAR(255),
    mp_name VARCHAR(255),
    constituency VARCHAR(150),
    work_description TEXT,
    completion_date DATE,
    image TEXT,
    amount_disbursed NUMERIC(15, 2)
);

CREATE TABLE IF NOT EXISTS calamity_consent (
    consent_id SERIAL PRIMARY KEY,
    mp_key VARCHAR(255),
    mp_id INTEGER REFERENCES mp(mp_id) ON DELETE SET NULL,
    mp_name VARCHAR(255),
    calamity_type VARCHAR(100),
    calamity_name VARCHAR(255),
    consent_date DATE,
    consent_amount NUMERIC(15, 2)
);

CREATE TABLE IF NOT EXISTS ai_signal (
    signal_id SERIAL PRIMARY KEY,
    signal_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    mp_name VARCHAR(255),
    state VARCHAR(100),
    constituency VARCHAR(150),
    severity VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    supporting_value NUMERIC(15, 2),
    threshold_value NUMERIC(15, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_run (
    run_id VARCHAR(100) PRIMARY KEY,
    dataset_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    rules_version VARCHAR(50) NOT NULL,
    detector_versions TEXT NOT NULL,
    project_count INTEGER NOT NULL,
    anomaly_count INTEGER NOT NULL,
    risk_distribution_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_risk (
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id),
    run_id VARCHAR(100) NOT NULL REFERENCES analysis_run(run_id),
    risk_score NUMERIC(5, 1) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    factor_scores_json TEXT NOT NULL,
    explanation_json TEXT NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY (work_id, run_id)
);

CREATE TABLE IF NOT EXISTS project_anomaly (
    anomaly_id VARCHAR(50) PRIMARY KEY,
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id),
    run_id VARCHAR(100) NOT NULL REFERENCES analysis_run(run_id),
    detector_name VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    score NUMERIC(5, 1) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    reason TEXT NOT NULL,
    comparison_group TEXT,
    comparison_statistics_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS project_evidence (
    evidence_id VARCHAR(50) PRIMARY KEY,
    anomaly_id VARCHAR(50) NOT NULL REFERENCES project_anomaly(anomaly_id),
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id),
    source_dataset VARCHAR(100) NOT NULL,
    source_record_id VARCHAR(100),
    observed_value NUMERIC(15, 2),
    comparison_value NUMERIC(15, 2),
    difference_value NUMERIC(15, 2),
    evidence_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS risk_case (
    case_id VARCHAR(50) PRIMARY KEY,
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id),
    run_id VARCHAR(100) REFERENCES analysis_run(run_id),
    case_status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    signal_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    peer_context_json TEXT,
    data_limitations_json TEXT,
    verification_recommendation TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_case_evidence (
    rc_evidence_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL REFERENCES risk_case(case_id),
    evidence_id VARCHAR(50) REFERENCES project_evidence(evidence_id),
    anomaly_id VARCHAR(50) REFERENCES project_anomaly(anomaly_id),
    evidence_role VARCHAR(50) NOT NULL DEFAULT 'SUPPORTING',
    source_dataset VARCHAR(100) NOT NULL,
    source_record_id VARCHAR(100),
    description TEXT NOT NULL,
    observed_value NUMERIC(15, 2),
    comparison_value NUMERIC(15, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_action (
    action_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL REFERENCES risk_case(case_id),
    work_id VARCHAR(50) NOT NULL REFERENCES work(work_id),
    officer_id VARCHAR(100),
    officer_name VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    action_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    finding TEXT,
    action_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100),
    actor_name VARCHAR(255),
    description TEXT NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pg_mp_key ON mp(mp_key);
CREATE INDEX IF NOT EXISTS idx_pg_work_mp_id ON work(mp_id);
CREATE INDEX IF NOT EXISTS idx_pg_exp_work_id ON expenditure_transaction(work_id);
CREATE INDEX IF NOT EXISTS idx_pg_exp_mp_id ON expenditure_transaction(mp_id);
CREATE INDEX IF NOT EXISTS idx_pg_comp_work_id ON completion(work_id);
CREATE INDEX IF NOT EXISTS idx_pg_ai_signal_type ON ai_signal(signal_type);
CREATE INDEX IF NOT EXISTS idx_pg_ai_signal_severity ON ai_signal(severity);
CREATE INDEX IF NOT EXISTS idx_pg_risk_case_work ON risk_case(work_id);
CREATE INDEX IF NOT EXISTS idx_pg_risk_case_status ON risk_case(case_status);
CREATE INDEX IF NOT EXISTS idx_pg_verification_case ON verification_action(case_id);
CREATE INDEX IF NOT EXISTS idx_pg_audit_entity ON audit_log(entity_type, entity_id);
"""
