"""
Base Detector Contract for Phase 2 MPLADS AI Risk Engine.
Defines standardized data models and base class interface for all anomaly detectors.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import sqlite3

@dataclass
class AnomalyResult:
    """Standardized result emitted by any detector."""
    project_id: str  # work_id
    anomaly_type: str  # e.g., COST_ANOMALY, UNUSUAL_DELAY, DUPLICATE_WORK
    score: float  # 0.0 to 1.0
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float  # 0.0 to 1.0
    reason: str  # Human-readable explanation string
    evidence: Dict[str, Any] = field(default_factory=dict)
    comparison_group: Optional[Dict[str, Any]] = None
    comparison_statistics: Optional[Dict[str, Any]] = None
    detector_name: str = "BaseDetector"
    detector_version: str = "1.0.0"

class BaseDetector(ABC):
    """Abstract Base Class for all MPLADS anomaly detectors."""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version

    @abstractmethod
    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        """
        Execute detection on SQLite database connection and return structured anomalies.
        """
        pass
