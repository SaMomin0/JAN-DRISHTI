"""
Detectors package for MPLADS Phase 2 Explainable AI Risk Engine.
Exports BaseDetector, AnomalyResult, and all domain detector classes.
"""

from .base import BaseDetector, AnomalyResult
from .cost_detector import CostAnomalyDetector
from .delay_detector import DelayAnomalyDetector
from .expenditure_detector import ExpenditureDetector
from .duplicate_detector import DuplicateWorkDetector
from .cross_dataset_detector import CrossDatasetDetector
from .data_quality_detector import DataQualityDetector

__all__ = [
    "BaseDetector",
    "AnomalyResult",
    "CostAnomalyDetector",
    "DelayAnomalyDetector",
    "ExpenditureDetector",
    "DuplicateWorkDetector",
    "CrossDatasetDetector",
    "DataQualityDetector"
]
