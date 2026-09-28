export interface PaginationMeta {
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  database: {
    status: string;
    ready: boolean;
    work_records: number;
    tables_count: number;
    database_path: string;
  };
}

export interface ProjectBase {
  work_id: string;
  work_category?: string;
  work?: string;
  state?: string;
  ida?: string;
  mp_name?: string;
  constituency?: string;
  work_description?: string;
  recommended_date?: string;
  sanction_date?: string;
  sanction_amount: number;
  work_status?: string;
}

export interface TransactionItem {
  transaction_id?: string;
  expenditure_date?: string;
  vendor_name?: string;
  payment_status?: string;
  fund_disbursed_amount: number;
}

export interface AISignalBrief {
  signal_id: number | string;
  signal_type: string;
  severity: string;
  reason: string;
  supporting_value?: number;
  threshold_value?: number;
  created_at?: string;
}

export interface ProjectDetail extends ProjectBase {
  total_expenditure: number;
  transaction_count: number;
  first_expenditure_date?: string;
  latest_expenditure_date?: string;
  has_completion_record: boolean;
  completion_date?: string;
  completion_amount_disbursed?: number;
  expenditure_vs_sanction_percent: number;
  remaining_sanction_amount: number;
  signals: AISignalBrief[];
  transactions: TransactionItem[];
}

export interface ProjectRiskResponse {
  work_id: string;
  run_id: string;
  risk_score: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  factor_scores: Record<string, number>;
  explanations: Record<string, string>;
  updated_at: string;
}

export interface AnomalyResponse {
  anomaly_id: string;
  work_id: string;
  run_id: string;
  detector_name: string;
  anomaly_type: string;
  severity: string;
  score: number;
  confidence: number;
  reason: string;
  comparison_group?: Record<string, any>;
  comparison_statistics?: Record<string, any>;
  created_at: string;
}

export interface EvidenceResponse {
  evidence_id: string;
  anomaly_id: string;
  work_id: string;
  source_dataset: string;
  source_record_id: string;
  observed_value: string;
  comparison_value: string;
  difference_value: string;
  evidence_details: Record<string, any>;
}

export interface ComparableProjectResponse {
  work_id: string;
  mp_name?: string;
  state?: string;
  constituency?: string;
  work_category?: string;
  sanction_amount: number;
  similarity_context: string;
}

export interface ProjectHistoryResponse {
  work_id: string;
  sanction_date?: string;
  recommended_date?: string;
  first_expenditure_date?: string;
  latest_expenditure_date?: string;
  completion_date?: string;
  total_expenditure: number;
  transaction_count: number;
  work_status?: string;
}

export interface RiskDistributionResponse {
  total_projects: number;
  distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  percentages: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface TopRiskFactor {
  factor_name: string;
  anomaly_count: number;
  average_score: number;
}

export interface RiskFactorSummaryResponse {
  factor_weights: Record<string, number>;
  top_risk_factors: TopRiskFactor[];
}

export interface FinancialOverview {
  total_works: number;
  total_sanction_amount: number;
  total_expenditure_amount: number;
  total_allocation_amount: number;
  total_calamity_amount: number;
  national_expenditure_rate_pct: number;
  completed_works_count: number;
  completion_rate_pct: number;
}

export interface StatusBreakdown {
  work_status: string;
  work_count: number;
  total_sanction_amount: number;
}

export interface TopMP {
  mp_name: string;
  state: string;
  constituency: string;
  total_works_sanctioned: number;
  total_expenditure: number;
  expenditure_percentage: number;
}

export interface TopVendor {
  vendor_name: string;
  distinct_works_count: number;
  transaction_count: number;
  total_disbursed_amount: number;
}

export interface StatisticsResponse {
  overview: FinancialOverview;
  status_breakdown: StatusBreakdown[];
  top_mps: TopMP[];
  top_vendors: TopVendor[];
}

export interface AnalysisRunResponse {
  run_id: string;
  dataset_hash: string;
  timestamp: string;
  rules_version: string;
  detector_versions: Record<string, string>;
  project_count: number;
  anomaly_count: number;
  risk_distribution: Record<string, number>;
}

export interface AISignalItem {
  signal_id: number;
  signal_type: string;
  entity_type: string;
  entity_id: string;
  mp_name?: string;
  state?: string;
  constituency?: string;
  severity: string;
  reason: string;
  supporting_value?: number;
  threshold_value?: number;
  created_at: string;
}

export interface WorkMonitoringIndicator {
  work_id: string;
  mp_name?: string;
  state?: string;
  constituency?: string;
  sanction_amount: number;
  total_expenditure: number;
  expenditure_transaction_count: number;
  has_completion_record: boolean;
  expenditure_exceeds_sanction: boolean;
  no_expenditure_record: boolean;
  expenditure_without_completion_record: boolean;
  days_from_recommendation_to_sanction?: number;
  days_from_sanction_to_first_expenditure?: number;
}

export interface RiskCaseListItem {
  case_id: string;
  work_id: string;
  run_id: string;
  case_status: 'OPEN' | 'UNDER_REVIEW' | 'VERIFIED' | 'CLOSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signal_count: number;
  evidence_count: number;
  verification_recommendation?: string;
  created_at: string;
  updated_at: string;
  mp_name?: string;
  state?: string;
  constituency?: string;
  work_category?: string;
  sanction_amount?: number;
  work_status?: string;
}
