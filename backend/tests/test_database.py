from backend.database.connection import get_connection, check_database_health

def test_database_health():
    health = check_database_health()
    assert health["status"] == "healthy"
    assert health["ready"] is True
    assert health["work_records"] > 0

def test_database_tables_and_views():
    with get_connection() as conn:
        cur = conn.cursor()
        # Verify master tables exist
        for table in ["mp", "work", "expenditure_transaction", "completion", "calamity_consent", "ai_signal"]:
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            assert count >= 0
            
        # Verify analytical views exist and return data
        for view in ["work_summary", "mp_summary", "monitoring_work", "monitoring_mp"]:
            cur.execute(f"SELECT COUNT(*) FROM {view};")
            count = cur.fetchone()[0]
            assert count > 0
