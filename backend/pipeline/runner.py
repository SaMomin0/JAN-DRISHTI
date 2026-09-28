"""
Canonical Pipeline Runner.
Orchestrates the entire end-to-end data pipeline:
Raw Ingestion -> Cleaning -> Reconciliation -> Database Build -> Analytics Views -> AI Signals -> Phase 2 Explainable Risk Engine & Persistence
"""

import sys
import time
import uuid
import json
import hashlib
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from backend.app.config import settings
from backend.pipeline.ingestion import verify_raw_datasets, load_raw_dataset
from backend.pipeline.cleaning import (
    clean_works_recommended,
    clean_works_sanctioned,
    clean_expenditure,
    clean_works_completed,
    clean_allocated_limit,
    clean_calamity_amount
)
from backend.pipeline.reconciliation import reconcile_and_build_masters
from backend.pipeline.indicators import build_views
from backend.pipeline.ai_signals import generate_ai_signals
from backend.pipeline.risk_engine import ExplainableRiskEngine

def persist_analysis_run(conn: sqlite3.Connection, engine: ExplainableRiskEngine) -> Dict[str, Any]:
    """Execute risk engine and persist analysis run, project risk, anomalies, and evidence."""
    from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)

    run_id = f"run_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    timestamp = datetime.utcnow().isoformat()
    
    profiles = engine.evaluate_all_works(conn)
    total_projects = len(profiles)
    total_anomalies = sum(len(p.anomalies) for p in profiles)
    
    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for p in profiles:
        risk_counts[p.risk_level] = risk_counts.get(p.risk_level, 0) + 1
        
    dataset_hash = hashlib.sha256(f"{run_id}_{total_projects}".encode()).hexdigest()[:16]
    detector_versions = json.dumps({d.name: d.version for d in engine.detectors})
    rules_version = "2.0.0"

    cur = conn.cursor()
    
    # 1. Store Analysis Run
    cur.execute("""
    INSERT INTO analysis_run (
        run_id, dataset_hash, timestamp, rules_version, detector_versions,
        project_count, anomaly_count, risk_distribution_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        run_id, dataset_hash, timestamp, rules_version, detector_versions,
        total_projects, total_anomalies, json.dumps(risk_counts)
    ))

    # 2. Store Project Risk Profiles, Anomalies & Evidence
    for p in profiles:
        cur.execute("""
        INSERT OR REPLACE INTO project_risk (
            work_id, run_id, risk_score, risk_level, confidence,
            factor_scores_json, explanation_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            p.work_id, run_id, p.risk_score, p.risk_level, p.confidence,
            json.dumps(p.factor_scores), json.dumps(p.explanations), timestamp
        ))

        for anom in p.anomalies:
            anomaly_id = f"anom_{uuid.uuid4().hex[:10]}"
            cur.execute("""
            INSERT INTO project_anomaly (
                anomaly_id, work_id, run_id, detector_name, anomaly_type,
                severity, score, confidence, reason, comparison_group,
                comparison_statistics_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                anomaly_id, p.work_id, run_id, anom.detector_name, anom.anomaly_type,
                anom.severity, anom.score, anom.confidence, anom.reason,
                json.dumps(anom.comparison_group) if anom.comparison_group else None,
                json.dumps(anom.comparison_statistics) if anom.comparison_statistics else None,
                timestamp
            ))

            if anom.evidence:
                evidence_id = f"ev_{uuid.uuid4().hex[:10]}"
                cur.execute("""
                INSERT INTO project_evidence (
                    evidence_id, anomaly_id, work_id, source_dataset,
                    source_record_id, observed_value, comparison_value,
                    difference_value, evidence_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    evidence_id, anomaly_id, p.work_id,
                    anom.evidence.get("source_dataset", "unknown"),
                    str(anom.evidence.get("source_record_id", p.work_id)),
                    anom.evidence.get("observed_value"),
                    anom.evidence.get("comparison_value"),
                    anom.evidence.get("difference_value"),
                    json.dumps(anom.evidence)
                ))

    conn.commit()
    
    return {
        "run_id": run_id,
        "dataset_hash": dataset_hash,
        "timestamp": timestamp,
        "rules_version": rules_version,
        "project_count": total_projects,
        "anomaly_count": total_anomalies,
        "risk_distribution": risk_counts
    }

def run_canonical_pipeline(
    raw_dir: Path = settings.DATA_RAW_DIR,
    cleaned_dir: Path = settings.DATA_CLEANED_DIR,
    db_path: Path = settings.DATABASE_PATH,
    save_cleaned_csvs: bool = True
) -> Dict[str, Any]:
    """Execute the full canonical pipeline end-to-end."""
    start_time = time.time()
    print("=" * 70)
    print("STARTING MPLADS CANONICAL PIPELINE EXECUTION")
    print("=" * 70)
    
    # 1. Ingestion Verification
    print("\n[1/7] Verifying raw datasets...")
    ingest_report = verify_raw_datasets(raw_dir)
    for k, v in ingest_report.items():
        print(f"  ✓ {k}: {v['filename']} ({v['size_mb']} MB)")
        
    # 2. Loading & Cleaning
    print("\n[2/7] Loading and cleaning raw datasets...")
    df_raw_rec = load_raw_dataset(raw_dir, "recommended")
    df_rec = clean_works_recommended(df_raw_rec)
    
    df_raw_sanc = load_raw_dataset(raw_dir, "sanctioned")
    df_sanc = clean_works_sanctioned(df_raw_sanc)
    
    df_raw_exp = load_raw_dataset(raw_dir, "expenditure")
    df_exp = clean_expenditure(df_raw_exp)
    
    df_raw_comp = load_raw_dataset(raw_dir, "completed")
    df_comp = clean_works_completed(df_raw_comp)
    
    df_raw_alloc = load_raw_dataset(raw_dir, "allocation")
    df_alloc = clean_allocated_limit(df_raw_alloc)
    
    df_raw_cal = load_raw_dataset(raw_dir, "calamity")
    df_cal = clean_calamity_amount(df_raw_cal)
    
    if save_cleaned_csvs:
        cleaned_dir.mkdir(exist_ok=True)
        df_rec.to_csv(cleaned_dir / "Works Recommended_cleaned.csv", index=False)
        df_sanc.to_csv(cleaned_dir / "Works Sanctioned_cleaned.csv", index=False)
        df_exp.to_csv(cleaned_dir / "Expenditure_cleaned.csv", index=False)
        df_comp.to_csv(cleaned_dir / "Works Completed_cleaned.csv", index=False)
        df_alloc.to_csv(cleaned_dir / "Allocated_Limit_cleaned.csv", index=False)
        df_cal.to_csv(cleaned_dir / "Amount_consented_Calamity_cleaned.csv", index=False)
        print("  ✓ Saved all cleaned CSV files.")
        
    # 3. Reconciliation & Master Table Building
    print("\n[3/7] Reconciling datasets and building masters...")
    masters, metrics = reconcile_and_build_masters(
        df_recommended=df_rec,
        df_sanctioned=df_sanc,
        df_expenditure=df_exp,
        df_completed=df_comp,
        df_allocation=df_alloc,
        df_calamity=df_cal
    )
    
    # 4. Database Population
    print(f"\n[4/7] Writing tables to SQLite database ({db_path})...")
    db_path.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    
    for table_name, df_table in masters.items():
        df_table.to_sql(table_name, conn, if_exists="replace", index=False)
        
    # Ensure Phase 2 tables exist
    from backend.database.schema import TABLES_DDL_SQLITE, INDEXES_DDL_SQLITE
    conn.executescript(TABLES_DDL_SQLITE)
    conn.executescript(INDEXES_DDL_SQLITE)
    
    # 5. Build Analytics & Monitoring Views
    print("\n[5/7] Building analytics and monitoring views...")
    build_views(conn)
    
    # 6. Generate AI Signals
    print("\n[6/7] Generating AI and anomaly signals...")
    signal_summary = generate_ai_signals(conn)
    
    # 7. Execute Phase 2 Explainable Risk Engine & Persist Run
    print("\n[7/7] Executing Phase 2 Explainable AI Risk Engine...")
    engine = ExplainableRiskEngine()
    analysis_run_summary = persist_analysis_run(conn, engine)
    print(f"  ✓ Analysis Run '{analysis_run_summary['run_id']}' created.")
    print(f"  ✓ Evaluated {analysis_run_summary['project_count']:,} projects, {analysis_run_summary['anomaly_count']:,} anomalies.")
    print(f"  ✓ Risk Distribution: {analysis_run_summary['risk_distribution']}")
    
    conn.close()
    elapsed = round(time.time() - start_time, 2)
    print("=" * 70)
    print(f"CANONICAL PIPELINE EXECUTION FINISHED IN {elapsed}s ✓")
    print("=" * 70)
    
    return {
        "status": "success",
        "elapsed_seconds": elapsed,
        "metrics": metrics,
        "signals": signal_summary,
        "analysis_run": analysis_run_summary
    }

if __name__ == "__main__":
    run_canonical_pipeline()
