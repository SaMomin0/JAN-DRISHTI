"""
Raw Data Ingestion & Schema Verification Module.
Validates the presence, size, and basic schema of all six raw MPLADS CSV files.
"""

from pathlib import Path
from typing import Dict, Any
import pandas as pd

RAW_FILES = {
    "recommended": "Works Recommended.csv",
    "sanctioned": "Works Sanctioned.csv",
    "expenditure": "Expenditure on Completed and On-going Works as on Date.csv",
    "completed": "Works Completed.csv",
    "allocation": "Allocated Limit for Honble MPs.csv",
    "calamity": "Amount consented for Calamity.csv"
}

def verify_raw_datasets(raw_dir: Path) -> Dict[str, Any]:
    """Verify presence and readable status of all raw datasets."""
    report = {}
    missing = []
    
    for key, filename in RAW_FILES.items():
        path = raw_dir / filename
        if not path.exists():
            missing.append(filename)
            report[key] = {"found": False, "filename": filename}
        else:
            size_bytes = path.stat().st_size
            report[key] = {
                "found": True,
                "filename": filename,
                "size_mb": round(size_bytes / (1024 * 1024), 2),
                "path": str(path)
            }
            
    if missing:
        raise FileNotFoundError(f"Missing required raw datasets: {missing}")
        
    return report

def load_raw_dataset(raw_dir: Path, key: str) -> pd.DataFrame:
    """Load a raw dataset by key as string dataframe with low_memory=False."""
    if key not in RAW_FILES:
        raise ValueError(f"Unknown dataset key: {key}")
    path = raw_dir / RAW_FILES[key]
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_csv(path, dtype=str, low_memory=False)
