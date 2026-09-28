"""
Migration script: SQLite -> PostgreSQL.
Reads data from the existing validated SQLite database and creates/populates PostgreSQL.
Can generate a .sql dump or connect directly via psycopg2/asyncpg if configured.
"""

import os
import sys
import sqlite3
from pathlib import Path

def generate_postgres_dump(sqlite_path: Path, output_sql_path: Path):
    """Generate a clean PostgreSQL compatible dump file from SQLite database."""
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite database not found at {sqlite_path}")
    
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    tables = ["mp", "work", "expenditure_transaction", "completion", "calamity_consent", "ai_signal"]
    
    with open(output_sql_path, "w", encoding="utf-8") as out:
        out.write("-- PostgreSQL Dump from MPLADS SQLite Database\n")
        out.write("-- Generated automatically for SIH26102 Phase 1 Migration\n\n")
        out.write("BEGIN;\n\n")
        
        for table in tables:
            cur.execute(f"PRAGMA table_info({table});")
            cols_info = cur.fetchall()
            col_names = [c["name"] for c in cols_info]
            
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            out.write(f"-- Table: {table} ({count} rows)\n")
            
            # Dump in batches of 1000
            cur.execute(f"SELECT * FROM {table};")
            while True:
                rows = cur.fetchmany(1000)
                if not rows:
                    break
                
                cols_str = ", ".join([f'"{c}"' for c in col_names])
                for row in rows:
                    vals = []
                    for v in row:
                        if v is None:
                            vals.append("NULL")
                        elif isinstance(v, (int, float)):
                            vals.append(str(v))
                        else:
                            clean_v = str(v).replace("'", "''")
                            vals.append(f"'{clean_v}'")
                    out.write(f"INSERT INTO {table} ({cols_str}) VALUES ({', '.join(vals)});\n")
            out.write("\n")
            
        out.write("COMMIT;\n")
    
    conn.close()
    print(f"Generated PostgreSQL dump at {output_sql_path}")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    sqlite_db = base_dir / "database" / "mplads.db"
    out_sql = base_dir / "backend" / "database" / "migrations" / "mplads_postgres_dump.sql"
    
    if sqlite_db.exists():
        generate_postgres_dump(sqlite_db, out_sql)
    else:
        print(f"Database not found: {sqlite_db}")
