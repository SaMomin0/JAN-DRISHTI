import pandas as pd
from backend.pipeline.cleaning import (
    clean_text,
    normalize_mp_name,
    extract_work_id,
    remove_grand_total,
    parse_date
)

def test_clean_text():
    assert clean_text("  Valid Text  ") == "Valid Text"
    assert clean_text("") is None
    assert clean_text("NaN") is None
    assert clean_text("NULL") is None
    assert clean_text(None) is None

def test_normalize_mp_name():
    assert normalize_mp_name("Dr. Rajesh Mishra") == "RAJESH MISHRA"
    assert normalize_mp_name("Shri Narendra Modi") == "NARENDRA MODI"
    assert normalize_mp_name("Smt. Nirmala Sitharaman") == "NIRMALA SITHARAMAN"
    assert normalize_mp_name("ADV GOWAAL KAGADA PADAVI") == "GOWAAL KAGADA PADAVI"

def test_extract_work_id():
    assert extract_work_id("133166") == "133166"
    assert extract_work_id("WS/MP620/2024-2025/133166-Construction of...") == "133166"
    assert extract_work_id("WS/MP18218/2025-2026/233777") == "233777"
    assert extract_work_id(None) is None

def test_remove_grand_total():
    df = pd.DataFrame({
        "Sr. No.": ["1", "2", "Grand Total"],
        "Value": [10, 20, 30]
    })
    cleaned = remove_grand_total(df, "Sr. No.")
    assert len(cleaned) == 2
    assert "Grand Total" not in cleaned["Sr. No."].values

def test_parse_date():
    dates = pd.Series(["08-Jul-2024", "2024-07-08", "InvalidDate"])
    parsed = parse_date(dates)
    assert parsed.iloc[0] == "2024-07-08"
    assert parsed.iloc[1] == "2024-07-08"
    assert pd.isna(parsed.iloc[2]) or parsed.iloc[2] is None
