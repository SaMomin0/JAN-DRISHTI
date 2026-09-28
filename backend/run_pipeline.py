#!/usr/bin/env python3
"""
CLI entrypoint to execute the complete MPLADS canonical data pipeline.
"""
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.pipeline.runner import run_canonical_pipeline

if __name__ == "__main__":
    result = run_canonical_pipeline()
    if result.get("status") == "success":
        print("\nAll pipeline stages executed successfully.")
        sys.exit(0)
    else:
        print("\nPipeline execution encountered errors.")
        sys.exit(1)
