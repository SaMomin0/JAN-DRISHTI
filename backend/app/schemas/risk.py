"""
Phase 2 Pydantic Schemas for Explainable Risk Engine, Analysis Runs, and Anomalies.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class AnalysisRunCreate(BaseModel):
    rules_version: Optional[str] = "2.0.0"

class AnalysisRunResponse(BaseModel):
    run_id: str
    dataset_hash: str
    timestamp: str
    rules_version: str
    detector_versions: Dict[str, str]
    project_count: int
    anomaly_count: int
    risk_distribution: Dict[str, int]

class ProjectRiskResponse(BaseModel):
    work_id: str
    run_id: str
    risk_score: float
    risk_level: str
    confidence: float
    factor_scores: Dict[str, float]
    explanations: List[str]
    updated_at: str

class AnomalyResponse(BaseModel):
    anomaly_id: str
    work_id: str
    run_id: str
    detector_name: str
    anomaly_type: str
    severity: str
    score: float
    confidence: float
    reason: str
    comparison_group: Optional[Dict[str, Any]] = None
    comparison_statistics: Optional[Dict[str, Any]] = None
    created_at: str

class EvidenceResponse(BaseModel):
    evidence_id: str
    anomaly_id: str
    work_id: str
    source_dataset: str
    source_record_id: Optional[str] = None
    observed_value: Optional[float] = None
    comparison_value: Optional[float] = None
    difference_value: Optional[float] = None
    evidence_details: Dict[str, Any]

class ComparableProjectResponse(BaseModel):
    work_id: str
    mp_name: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    work_category: Optional[str] = None
    sanction_amount: Optional[float] = None
    similarity_context: str

class ProjectHistoryResponse(BaseModel):
    work_id: str
    sanction_date: Optional[str] = None
    recommended_date: Optional[str] = None
    first_expenditure_date: Optional[str] = None
    latest_expenditure_date: Optional[str] = None
    completion_date: Optional[str] = None
    total_expenditure: float
    transaction_count: int
    work_status: Optional[str] = None

class RiskDistributionResponse(BaseModel):
    total_projects: int
    distribution: Dict[str, int]
    percentages: Dict[str, float]

class RiskFactorSummaryResponse(BaseModel):
    factor_weights: Dict[str, float]
    top_risk_factors: List[Dict[str, Any]]
