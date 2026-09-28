import pandas as pd
from backend.pipeline.reconciliation import reconcile_and_build_masters

def test_reconcile_and_build_masters():
    # Sample test data
    rec = pd.DataFrame({
        "work_id": ["101", "102"],
        "recommended_amount": [50000, 60000],
        "work_status": ["SANCTIONED", "SANCTIONED"]
    })
    sanc = pd.DataFrame({
        "work_id": ["101", "102"],
        "mp_name": ["Shri Rajesh Kumar", "Dr Amit Shah"],
        "sanction_amount": [50000.0, 60000.0],
        "work_status": ["Sanction", "Work Completed"]
    })
    exp = pd.DataFrame({
        "work_id": ["101"],
        "mp_name": ["Rajesh Kumar"],
        "fund_disbursed_amount": [50000.0]
    })
    comp = pd.DataFrame({
        "work_id": ["101"],
        "mp_name": ["Rajesh Kumar"],
        "amount_disbursed": [50000.0]
    })
    alloc = pd.DataFrame({
        "mp_name": ["Rajesh Kumar", "Amit Shah"],
        "state": ["State A", "State B"],
        "constituency": ["Const A", "Const B"],
        "allocated_amount": [1000000.0, 2000000.0]
    })
    cal = pd.DataFrame({
        "mp_name": ["Rajesh Kumar"],
        "calamity_type": ["National"],
        "calamity_name": ["Flood"],
        "consent_amount": [100000.0]
    })
    
    tables, metrics = reconcile_and_build_masters(rec, sanc, exp, comp, alloc, cal)
    
    assert "mp" in tables
    assert "work" in tables
    assert len(tables["mp"]) == 2
    assert len(tables["work"]) == 2
    assert metrics["expenditure_match_rate"] == 100.0
    assert metrics["completed_match_rate"] == 100.0
    assert metrics["calamity_mp_match_rate"] == 100.0
