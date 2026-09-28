"""
Five-Signal Intelligence Engine — Canonical Interface Module.

This module defines the authoritative boundaries, input/output contracts,
and implementation status for each of the five MPLADS intelligence signals.

Phase 1 scope: Interfaces and module structure established.
               Existing detector logic is wired to these interfaces.
Phase 2 scope: Full detector implementations with statistical thresholds,
               ML-based peer comparison, and configurable parameters.

SIGNAL ARCHITECTURE PRINCIPLE:
  A Signal is NOT a verdict. It is a reason to investigate.
  Each signal must:
    - Reference actual available MPLADS dataset fields
    - Document data-quality limitations
    - Produce traceable evidence with source_dataset + source_record_id
    - NOT fabricate values for missing data
"""

import sqlite3
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from backend.domain.models import Signal, SignalType, SignalSeverity, DataLimitation


# ---------------------------------------------------------------------------
# Base Signal Detector Interface
# ---------------------------------------------------------------------------

class SignalDetector(ABC):
    """
    Canonical abstract base class for all five signal detectors.
    Replaces and supersedes the legacy BaseDetector from pipeline/detectors/base.py,
    which remains for backward compatibility with the ExplainableRiskEngine in Phase 2.
    """

    signal_type: SignalType
    version: str = "1.0.0"

    @abstractmethod
    def detect(self, conn: sqlite3.Connection) -> List[Signal]:
        """
        Execute detection against the SQLite database and return structured signals.
        Must never fabricate values. Must document data limitations.
        """
        ...

    def get_data_limitations(self, conn: sqlite3.Connection) -> List[DataLimitation]:
        """
        Override to report known data limitations for this detector.
        Called by the corroboration layer to annotate Risk Cases.
        """
        return []


# ---------------------------------------------------------------------------
# Signal 1 — Cost Anomaly
# ---------------------------------------------------------------------------

@dataclass
class CostAnomalyInterface:
    """
    Signal 1: Cost Anomaly Detection.

    PURPOSE:
      Detect works where the sanction_amount is statistically unusual
      relative to peer projects in the same geographic and category context.

    REQUIRED INPUTS (from DB):
      work.work_id, work.sanction_amount, work.state, work.constituency,
      work.work_category

    ACTUAL AVAILABLE FIELDS: ✓ All present in `work` table.

    PEER COMPARISON GROUPING:
      Primary:   state + constituency + work_category (min 3 peers)
      Fallback:  state + work_category (min 5 peers)

    OUTPUT STRUCTURE:
      Signal(signal_type=COST_ANOMALY, score=0-100,
             evidence={source_dataset, observed_value, comparison_value,
                       difference_value, ratio_to_mean, peer_count, peer_mean})

    DATA LIMITATIONS:
      - Peer groups with < 3 works are skipped (insufficient baseline)
      - Sanction amounts NULL or <= 0 are excluded
      - No inflation adjustment across fiscal years

    EXISTING LOGIC: CostAnomalyDetector in pipeline/detectors/cost_detector.py
    PHASE 2 ENHANCEMENTS: IQR-based thresholds, configurable sensitivity
    """
    pass


# ---------------------------------------------------------------------------
# Signal 2 — Delay / Timeline Deviation
# ---------------------------------------------------------------------------

@dataclass
class DelayDeviationInterface:
    """
    Signal 2: Delay / Timeline Deviation.

    PURPOSE:
      Detect works with abnormal delays between lifecycle events:
        - Sanction → First Expenditure
        - Sanction → Completion
        - Currently active works sanctioned long ago with no completion

    REQUIRED INPUTS (from DB):
      work.work_id, work.sanction_date, work.work_status,
      expenditure_transaction.expenditure_date (MIN per work_id),
      completion.completion_date

    ACTUAL AVAILABLE FIELDS: ✓ All present.

    THRESHOLDS (Phase 1 defaults, configurable in Phase 2):
      Sanction→Expenditure: >= 180 days = signal
      Sanction→Completion:  >= 365 days = signal
      Active uncompleted:   >= 500 days since sanction = signal

    OUTPUT STRUCTURE:
      Signal(signal_type=DELAY_DEVIATION, score=0-100,
             evidence={sanction_date, first_expenditure_date, completion_date,
                       observed_days, threshold_days, difference_days})

    DATA LIMITATIONS:
      - Date parsing failures result in NULL delay values (skipped)
      - 'Work Completed' status in work table may lag actual completion
      - No fiscal year context for delay normalization

    EXISTING LOGIC: DelayAnomalyDetector in pipeline/detectors/delay_detector.py
    PHASE 2 ENHANCEMENTS: Peer-median normalization, category-adjusted thresholds
    """
    pass


# ---------------------------------------------------------------------------
# Signal 3 — Payment Pattern Anomaly
# ---------------------------------------------------------------------------

@dataclass
class PaymentPatternInterface:
    """
    Signal 3: Payment Pattern Anomaly.

    PURPOSE:
      Detect unusual patterns in how expenditure is disbursed:
        - Expenditure exceeding sanctioned amount
        - High vendor concentration (one vendor, many works)
        - Payments stuck in 'Payment In-Progress' status
        - Multi-tranche disbursals over full sanction amount

    REQUIRED INPUTS (from DB):
      expenditure_transaction.work_id, fund_disbursed_amount,
      payment_status, vendor_name,
      work.sanction_amount

    ACTUAL AVAILABLE FIELDS: ✓ All present.

    PAYMENT STATUS VALUES OBSERVED IN DATA:
      'Payment In-Progress', 'Payment Released', 'Payment Done'

    OUTPUT STRUCTURE:
      Signal(signal_type=PAYMENT_PATTERN, score=0-100,
             evidence={source_dataset, payment_status, vendor_name,
                       observed_value, comparison_value, transaction_count})

    DATA LIMITATIONS:
      - vendor_name is free-text; same vendor may appear under multiple names
      - fund_disbursed_amount NULL rows treated as 0 (documented limitation)
      - Payment status taxonomy not formally defined in MPLADS schema

    EXISTING LOGIC: ExpenditureDetector in pipeline/detectors/expenditure_detector.py
    PHASE 2 ENHANCEMENTS: Vendor name normalization, temporal payment clustering
    """
    pass


# ---------------------------------------------------------------------------
# Signal 4 — Potentially Similar Work
# ---------------------------------------------------------------------------

@dataclass
class SimilarWorkInterface:
    """
    Signal 4: Potentially Similar Work.

    PURPOSE:
      Detect works within the same constituency that have highly similar
      titles and descriptions — potential duplicate work orders.
      Similarity is CONTEXTUAL, not conclusive.

    REQUIRED INPUTS (from DB):
      work.work_id, work.work, work.work_description, work.work_category,
      work.state, work.constituency, work.sanction_amount, work.sanction_date

    ACTUAL AVAILABLE FIELDS: ✓ All present (work/work_description may be sparse).

    SIMILARITY METHOD (Phase 1):
      TF-IDF token cosine similarity within state+constituency groups.
      Threshold: >= 0.85 cosine similarity = signal.
      Comparison capped at 150 works per group (performance).

    OUTPUT STRUCTURE:
      Signal(signal_type=SIMILAR_WORK, score=0-100,
             evidence={compared_work_id, similarity_score, common_keywords,
                       work_1_title, work_2_title, sanction_amounts})

    DATA LIMITATIONS:
      - Short or sparse work descriptions reduce accuracy significantly
      - No semantic embeddings in Phase 1 (lexical similarity only)
      - Groups > 150 works are truncated — large constituencies may miss pairs
      - Similarity does not imply fraud; infrastructure categories legitimately repeat

    EXISTING LOGIC: DuplicateWorkDetector in pipeline/detectors/duplicate_detector.py
    PHASE 2 ENHANCEMENTS: Sentence embeddings, geographic clustering, date proximity
    """
    pass


# ---------------------------------------------------------------------------
# Signal 5 — Progress Mismatch
# ---------------------------------------------------------------------------

@dataclass
class ProgressMismatchInterface:
    """
    Signal 5: Progress Mismatch.

    PURPOSE:
      Detect inconsistencies between what is reported (work_status),
      what is financially recorded (expenditure), and what is
      officially certified (completion record):
        - Expenditure present but no completion record
        - Completion record but no expenditure record
        - Amount mismatch between completion disbursement and expenditure total
        - Chronologically impossible dates (completion before sanction)

    REQUIRED INPUTS (from DB):
      work.work_id, work.work_status, work.sanction_amount,
      expenditure_transaction (aggregated per work_id),
      completion.completion_date, completion.amount_disbursed

    ACTUAL AVAILABLE FIELDS: ✓ All present.

    CROSS-DATASET LOGIC:
      Expenditure present ∧ No completion record → PROGRESS_MISMATCH
      Completion disbursed != Expenditure total (diff > ₹100) → PROGRESS_MISMATCH
      Completion date < Sanction date → DATA_QUALITY issue flagged

    OUTPUT STRUCTURE:
      Signal(signal_type=PROGRESS_MISMATCH, score=0-100,
             evidence={missing_in_dataset, observed_value, comparison_value,
                       difference_value, transaction_count, completion_date})

    DATA LIMITATIONS:
      - Completion dataset may be updated with a reporting lag
      - amount_disbursed in completion table sometimes NULL
      - work_status field is source-reported and may not match completion dataset

    EXISTING LOGIC: CrossDatasetDetector in pipeline/detectors/cross_dataset_detector.py
                    DataQualityDetector in pipeline/detectors/data_quality_detector.py
    PHASE 2 ENHANCEMENTS: Temporal consistency checks, status transition validation
    """
    pass


# ---------------------------------------------------------------------------
# Signal → Domain Model Mapping (for Phase 2 migration adapter)
# ---------------------------------------------------------------------------

# Maps legacy anomaly_type strings (from detectors) to canonical SignalType
ANOMALY_TYPE_TO_SIGNAL_TYPE: Dict[str, SignalType] = {
    "COST_ANOMALY": SignalType.COST_ANOMALY,
    "SANCTION_TO_EXPENDITURE_DELAY": SignalType.DELAY_DEVIATION,
    "LONG_SANCTION_TO_COMPLETION": SignalType.DELAY_DEVIATION,
    "PROLONGED_UNCOMPLETED_WORK": SignalType.DELAY_DEVIATION,
    "EXPENDITURE_EXCEEDS_SANCTION": SignalType.PAYMENT_PATTERN,
    "HIGH_EXPENDITURE_RATIO": SignalType.PAYMENT_PATTERN,
    "PAYMENT_IN_PROGRESS": SignalType.PAYMENT_PATTERN,
    "VENDOR_CONCENTRATION": SignalType.PAYMENT_PATTERN,
    "DUPLICATE_WORK_CANDIDATE": SignalType.SIMILAR_WORK,
    "EXPENDITURE_WITHOUT_COMPLETION": SignalType.PROGRESS_MISMATCH,
    "NO_EXPENDITURE_RECORD": SignalType.PROGRESS_MISMATCH,
    "CROSS_DATASET_AMOUNT_MISMATCH": SignalType.PROGRESS_MISMATCH,
    "INVALID_DATE_SEQUENCE": SignalType.PROGRESS_MISMATCH,
    "INVALID_SANCTION_AMOUNT": SignalType.PROGRESS_MISMATCH,
    "MISSING_GEOGRAPHIC_METADATA": SignalType.PROGRESS_MISMATCH,
}


def map_anomaly_to_signal_type(anomaly_type: str) -> SignalType:
    """Map a legacy detector anomaly_type string to canonical SignalType."""
    return ANOMALY_TYPE_TO_SIGNAL_TYPE.get(anomaly_type, SignalType.PROGRESS_MISMATCH)


SIGNAL_ENGINE_STATUS: Dict[str, Dict[str, Any]] = {
    "COST_ANOMALY": {
        "status": "OPERATIONAL",
        "detector": "CostAnomalyDetector",
        "version": "1.0.0",
        "phase": 1,
        "notes": "Peer-group contextual comparison. Phase 2 will add IQR thresholds."
    },
    "DELAY_DEVIATION": {
        "status": "OPERATIONAL",
        "detector": "DelayAnomalyDetector",
        "version": "1.0.0",
        "phase": 1,
        "notes": "Fixed thresholds (180/365/500 days). Phase 2 will normalize by category."
    },
    "PAYMENT_PATTERN": {
        "status": "OPERATIONAL",
        "detector": "ExpenditureDetector",
        "version": "1.0.0",
        "phase": 1,
        "notes": "Ratio, in-progress, and vendor concentration. Phase 2 adds name normalization."
    },
    "SIMILAR_WORK": {
        "status": "OPERATIONAL",
        "detector": "DuplicateWorkDetector",
        "version": "1.0.0",
        "phase": 1,
        "notes": "Lexical cosine similarity only. Phase 2 will add semantic embeddings."
    },
    "PROGRESS_MISMATCH": {
        "status": "OPERATIONAL",
        "detector": "CrossDatasetDetector + DataQualityDetector",
        "version": "1.0.0",
        "phase": 1,
        "notes": "Cross-dataset reconciliation and date logic. Operational."
    },
}
