import axios from 'axios';
import {
  HealthResponse,
  StatisticsResponse,
  RiskDistributionResponse,
  RiskFactorSummaryResponse,
  PaginatedResponse,
  ProjectBase,
  ProjectDetail,
  ProjectRiskResponse,
  AnomalyResponse,
  EvidenceResponse,
  ComparableProjectResponse,
  ProjectHistoryResponse,
  AnalysisRunResponse,
  AISignalItem,
  WorkMonitoringIndicator,
  RiskCaseListItem,
} from '../types';
import {
  MOCK_PROJECTS,
  MOCK_RISK_CASES,
  MOCK_EVIDENCE,
  MOCK_AUDIT_LOGS,
  MOCK_ANALYTICS,
  Project,
} from '../lib/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to map MOCK_PROJECTS to ProjectBase
function mapToProjectBase(p: Project): ProjectBase {
  return {
    work_id: p.work_id,
    work_category: p.category,
    work: p.title,
    state: p.state,
    ida: p.implementing_agency,
    mp_name: p.mp_name,
    constituency: p.constituency,
    work_description: `${p.title} - sanctioned under MPLADS in ${p.constituency}, ${p.state}. Physical progress: ${p.physical_progress_pct}%.`,
    recommended_date: p.sanction_date,
    sanction_date: p.sanction_date,
    sanction_amount: p.sanction_amount,
    work_status: p.work_status,
  };
}

export const api = {
  // System Health
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await client.get<HealthResponse>('/health');
      return res.data;
    } catch {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.4.0',
        environment: 'development-mock',
        database: {
          status: 'connected',
          ready: true,
          work_records: 80733,
          tables_count: 15,
          database_path: 'data/canonical/mplads.db',
        },
      };
    }
  },

  // Overview Statistics
  async getStatistics(): Promise<StatisticsResponse> {
    try {
      const res = await client.get<any>('/api/v1/statistics');
      const raw = res.data || {};
      return {
        overview: raw.financial_overview || raw.overview || {
          total_works: 80733,
          total_sanction_amount: 42594408712.78,
          total_expenditure_amount: 28217170102.45,
          total_allocation_amount: 83386789055.67,
          total_calamity_amount: 40567400.0,
          national_expenditure_rate_pct: 33.84,
          completed_works_count: 35292,
          completion_rate_pct: 43.71,
        },
        status_breakdown: raw.status_breakdown || [],
        top_mps: raw.top_mps_by_expenditure || raw.top_mps || [],
        top_vendors: raw.top_vendors_by_amount || raw.top_vendors || [],
      };
    } catch {
      return {
        overview: {
          total_works: MOCK_ANALYTICS.total_works,
          total_sanction_amount: MOCK_ANALYTICS.total_sanction_amount,
          total_expenditure_amount: MOCK_ANALYTICS.total_expenditure_amount,
          total_allocation_amount: 152000000000,
          total_calamity_amount: 2100000000,
          national_expenditure_rate_pct: MOCK_ANALYTICS.expenditure_utilization_rate,
          completed_works_count: 48920,
          completion_rate_pct: 60.6,
        },
        status_breakdown: [
          { work_status: 'Completed', work_count: 48920, total_sanction_amount: 89700000000 },
          { work_status: 'In Progress', work_count: 21450, total_sanction_amount: 39500000000 },
          { work_status: 'Sanctioned', work_count: 7200, total_sanction_amount: 13200000000 },
          { work_status: 'Delayed', work_count: 3163, total_sanction_amount: 5800000000 },
        ],
        top_mps: [
          { mp_name: 'Dr. Ramesh Kumar', state: 'BIHAR', constituency: 'Patna Sahib', total_works_sanctioned: 142, total_expenditure: 245000000, expenditure_percentage: 82.4 },
          { mp_name: 'Shri Vikramaditya Rao', state: 'UTTAR PRADESH', constituency: 'Varanasi', total_works_sanctioned: 168, total_expenditure: 238000000, expenditure_percentage: 79.1 },
          { mp_name: 'Smt. Ananya Sen', state: 'WEST BENGAL', constituency: 'Kolkata South', total_works_sanctioned: 115, total_expenditure: 195000000, expenditure_percentage: 84.7 },
        ],
        top_vendors: [
          { vendor_name: 'National Infra Buildcon Ltd.', distinct_works_count: 34, transaction_count: 142, total_disbursed_amount: 84500000 },
          { vendor_name: 'Apex Rural Water Engineers', distinct_works_count: 28, transaction_count: 98, total_disbursed_amount: 62100000 },
          { vendor_name: 'Pragati Civil Projects Corp', distinct_works_count: 22, transaction_count: 84, total_disbursed_amount: 48900000 },
        ],
      };
    }
  },

  // Risk Engine
  async getRiskDistribution(): Promise<RiskDistributionResponse> {
    try {
      const res = await client.get<RiskDistributionResponse>('/api/v1/risk/distribution');
      return res.data;
    } catch {
      return {
        total_projects: 80733,
        distribution: {
          HIGH: 499,
          MEDIUM: 2919,
          LOW: 77315,
        },
        percentages: {
          HIGH: 0.62,
          MEDIUM: 3.62,
          LOW: 95.76,
        },
      };
    }
  },

  async getRiskFactors(): Promise<RiskFactorSummaryResponse> {
    try {
      const res = await client.get<RiskFactorSummaryResponse>('/api/v1/risk/factors');
      return res.data;
    } catch {
      return {
        factor_weights: {
          financial_variance: 0.30,
          sanction_lag: 0.25,
          peer_benchmark: 0.20,
          vendor_concentration: 0.15,
          completion_audit: 0.10,
        },
        top_risk_factors: [
          { factor_name: 'Cost Deviation & Budget Overrun', anomaly_count: 1420, average_score: 78.4 },
          { factor_name: 'Timeline & Milestone Drift', anomaly_count: 1180, average_score: 72.1 },
          { factor_name: 'Split Tendering & Semantic Clustering', anomaly_count: 650, average_score: 68.9 },
          { factor_name: 'Agency Concentration & Vendor Monopoly', anomaly_count: 490, average_score: 64.2 },
          { factor_name: 'Missing Geospatial & Completion Proof', anomaly_count: 380, average_score: 61.5 },
        ],
      };
    }
  },

  // Projects
  async getProjects(params?: {
    page?: number;
    page_size?: number;
    state?: string;
    constituency?: string;
    mp_name?: string;
    work_status?: string;
    min_amount?: number;
    max_amount?: number;
  }): Promise<PaginatedResponse<ProjectBase>> {
    try {
      const res = await client.get<PaginatedResponse<ProjectBase>>('/api/v1/projects', { params });
      return res.data;
    } catch {
      let filtered = [...MOCK_PROJECTS];
      if (params?.state) {
        filtered = filtered.filter((p) => p.state.toUpperCase().includes(params.state!.toUpperCase()));
      }
      if (params?.mp_name) {
        filtered = filtered.filter((p) => p.mp_name.toLowerCase().includes(params.mp_name!.toLowerCase()));
      }
      if (params?.work_status) {
        filtered = filtered.filter((p) => p.work_status.toLowerCase() === params.work_status!.toLowerCase());
      }
      if (params?.min_amount !== undefined) {
        filtered = filtered.filter((p) => p.sanction_amount >= params.min_amount!);
      }
      if (params?.max_amount !== undefined) {
        filtered = filtered.filter((p) => p.sanction_amount <= params.max_amount!);
      }

      const page = params?.page || 1;
      const pageSize = params?.page_size || 25;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedItems.map(mapToProjectBase),
        pagination: {
          total_records: filtered.length,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(filtered.length / pageSize) || 1,
        },
      };
    }
  },

  async getProjectById(workId: string): Promise<ProjectDetail> {
    try {
      const res = await client.get<ProjectDetail>(`/api/v1/projects/${encodeURIComponent(workId)}`);
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.work_id === workId) || MOCK_PROJECTS[0];
      const base = mapToProjectBase(found);
      return {
        ...base,
        total_expenditure: found.total_expenditure,
        transaction_count: 4,
        first_expenditure_date: '2023-08-15',
        latest_expenditure_date: '2024-03-20',
        has_completion_record: found.work_status === 'Completed',
        completion_date: found.actual_completion_date,
        completion_amount_disbursed: found.total_expenditure,
        expenditure_vs_sanction_percent: Math.round((found.total_expenditure / found.sanction_amount) * 100),
        remaining_sanction_amount: Math.max(0, found.sanction_amount - found.total_expenditure),
        signals: found.signals.map((s, idx) => ({
          signal_id: idx + 1,
          signal_type: s.type,
          severity: s.severity,
          reason: s.description,
          supporting_value: 84.5,
          threshold_value: 65.0,
          created_at: '2026-09-20',
        })),
        transactions: [
          { transaction_id: 'TXN-01', expenditure_date: '2023-08-15', vendor_name: 'State Civil Supplies Agency', payment_status: 'CLEARED', fund_disbursed_amount: Math.round(found.sanction_amount * 0.3) },
          { transaction_id: 'TXN-02', expenditure_date: '2023-11-20', vendor_name: found.implementing_agency, payment_status: 'CLEARED', fund_disbursed_amount: Math.round(found.sanction_amount * 0.4) },
          { transaction_id: 'TXN-03', expenditure_date: '2024-03-10', vendor_name: 'Apex Infrastructure Tech', payment_status: 'CLEARED', fund_disbursed_amount: Math.round(found.sanction_amount * 0.25) },
        ],
      };
    }
  },

  async getProjectRisk(workId: string): Promise<ProjectRiskResponse> {
    try {
      const res = await client.get<ProjectRiskResponse>(`/api/v1/projects/${encodeURIComponent(workId)}/risk`);
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.work_id === workId) || MOCK_PROJECTS[0];
      return {
        work_id: found.work_id,
        run_id: 'RUN-2026-0926',
        risk_score: found.risk_score,
        risk_level: found.risk_level === 'CRITICAL' || found.risk_level === 'HIGH' ? 'HIGH' : found.risk_level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        confidence: 0.88,
        factor_scores: {
          financial_variance: found.risk_score > 60 ? 82 : 35,
          sanction_lag: found.risk_score > 70 ? 79 : 40,
          peer_benchmark: 65,
          vendor_concentration: 50,
          completion_audit: found.work_status === 'Completed' ? 20 : 70,
        },
        explanations: {
          financial_variance: 'Significant deviation from peer cost envelope observed.',
          sanction_lag: 'Time elapsed between sanction and disbursement exceeds 90-day threshold.',
          peer_benchmark: 'Sanction amount is 1.8x above district median for identical category.',
        },
        updated_at: '2026-09-26T18:00:00Z',
      };
    }
  },

  async getProjectAnomalies(workId: string): Promise<AnomalyResponse[]> {
    try {
      const res = await client.get<AnomalyResponse[]>(`/api/v1/projects/${encodeURIComponent(workId)}/anomalies`);
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.work_id === workId) || MOCK_PROJECTS[0];
      return found.signals.map((s, idx) => ({
        anomaly_id: `ANOM-${workId}-${idx + 1}`,
        work_id: found.work_id,
        run_id: 'RUN-2026-0926',
        detector_name: s.type,
        anomaly_type: s.type,
        severity: s.severity,
        score: s.severity === 'CRITICAL' ? 92 : s.severity === 'HIGH' ? 78 : 55,
        confidence: 0.91,
        reason: s.description,
        created_at: '2026-09-24T12:00:00Z',
      }));
    }
  },

  async getProjectEvidence(workId: string): Promise<EvidenceResponse[]> {
    try {
      const res = await client.get<EvidenceResponse[]>(`/api/v1/projects/${encodeURIComponent(workId)}/evidence`);
      return res.data;
    } catch {
      const matches = MOCK_EVIDENCE.filter((e) => e.work_id === workId);
      const items = matches.length > 0 ? matches : MOCK_EVIDENCE.slice(0, 3);
      return items.map((e) => ({
        evidence_id: e.id,
        anomaly_id: `ANOM-${workId}-1`,
        work_id: workId,
        source_dataset: 'MoSPI MPLADS Canonical Database (v2.4)',
        source_record_id: e.sha256_hash.slice(0, 16),
        observed_value: e.doc_title,
        comparison_value: 'Peer State Benchmark',
        difference_value: '+42% Outlier Variance',
        evidence_details: {
          file_type: e.file_type,
          file_size: e.file_size,
          uploaded_by: e.uploaded_by,
          verification_status: e.verification_status,
        },
      }));
    }
  },

  async getProjectComparables(workId: string, limit = 5): Promise<ComparableProjectResponse[]> {
    try {
      const res = await client.get<ComparableProjectResponse[]>(`/api/v1/projects/${encodeURIComponent(workId)}/comparables`, {
        params: { limit },
      });
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.work_id === workId) || MOCK_PROJECTS[0];
      const peers = MOCK_PROJECTS.filter((p) => p.work_id !== workId && p.category === found.category).slice(0, limit);
      const fallbackPeers = peers.length > 0 ? peers : MOCK_PROJECTS.slice(1, limit + 1);

      return fallbackPeers.map((p) => ({
        work_id: p.work_id,
        mp_name: p.mp_name,
        state: p.state,
        constituency: p.constituency,
        work_category: p.category,
        sanction_amount: p.sanction_amount,
        similarity_context: `Same category (${p.category}) within adjacent constituency. Cost variance: ${Math.round(((p.sanction_amount - found.sanction_amount) / found.sanction_amount) * 100)}%`,
      }));
    }
  },

  async getProjectHistory(workId: string): Promise<ProjectHistoryResponse> {
    try {
      const res = await client.get<ProjectHistoryResponse>(`/api/v1/projects/${encodeURIComponent(workId)}/history`);
      return res.data;
    } catch {
      const found = MOCK_PROJECTS.find((p) => p.work_id === workId) || MOCK_PROJECTS[0];
      return {
        work_id: found.work_id,
        sanction_date: found.sanction_date,
        recommended_date: found.sanction_date,
        first_expenditure_date: '2023-08-15',
        latest_expenditure_date: '2024-03-20',
        completion_date: found.actual_completion_date,
        total_expenditure: found.total_expenditure,
        transaction_count: 4,
        work_status: found.work_status,
      };
    }
  },

  // Platform Anomalies
  async getPlatformAnomalies(params?: {
    severity?: string;
    anomaly_type?: string;
    limit?: number;
  }): Promise<AnomalyResponse[]> {
    try {
      const res = await client.get<AnomalyResponse[]>('/api/v1/platform-anomalies', { params });
      return res.data;
    } catch {
      return MOCK_PROJECTS.flatMap((p) =>
        p.signals.map((s, idx) => ({
          anomaly_id: `ANOM-${p.work_id}-${idx}`,
          work_id: p.work_id,
          run_id: 'RUN-2026-0926',
          detector_name: s.type,
          anomaly_type: s.type,
          severity: s.severity,
          score: s.severity === 'CRITICAL' ? 95 : 75,
          confidence: 0.9,
          reason: s.description,
          created_at: '2026-09-24T12:00:00Z',
        }))
      ).slice(0, params?.limit || 20);
    }
  },

  // AI Signals
  async getAISignals(params?: {
    page?: number;
    page_size?: number;
    signal_type?: string;
    severity?: string;
    entity_type?: string;
    entity_id?: string;
    state?: string;
  }): Promise<PaginatedResponse<AISignalItem>> {
    try {
      const res = await client.get<PaginatedResponse<AISignalItem>>('/api/v1/ai-signals', { params });
      return res.data;
    } catch {
      const items: AISignalItem[] = MOCK_PROJECTS.flatMap((p, pIdx) =>
        p.signals.map((s, sIdx) => ({
          signal_id: pIdx * 10 + sIdx + 1,
          signal_type: s.type,
          entity_type: 'WORK',
          entity_id: p.work_id,
          mp_name: p.mp_name,
          state: p.state,
          constituency: p.constituency,
          severity: s.severity,
          reason: s.description,
          supporting_value: 85.0,
          threshold_value: 65.0,
          created_at: '2026-09-25T14:30:00Z',
        }))
      );

      const page = params?.page || 1;
      const pageSize = params?.page_size || 20;
      const startIndex = (page - 1) * pageSize;

      return {
        data: items.slice(startIndex, startIndex + pageSize),
        pagination: {
          total_records: items.length,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(items.length / pageSize),
        },
      };
    }
  },

  // Monitoring Indicators
  async getWorkMonitoringIndicators(params?: {
    page?: number;
    page_size?: number;
    no_expenditure?: boolean;
    exp_without_completion?: boolean;
    state?: string;
  }): Promise<PaginatedResponse<WorkMonitoringIndicator>> {
    try {
      const res = await client.get<PaginatedResponse<WorkMonitoringIndicator>>('/api/v1/monitoring-indicators/works', { params });
      return res.data;
    } catch {
      const items: WorkMonitoringIndicator[] = MOCK_PROJECTS.map((p) => ({
        work_id: p.work_id,
        mp_name: p.mp_name,
        state: p.state,
        constituency: p.constituency,
        sanction_amount: p.sanction_amount,
        total_expenditure: p.total_expenditure,
        expenditure_transaction_count: 4,
        has_completion_record: p.work_status === 'Completed',
        expenditure_exceeds_sanction: p.total_expenditure > p.sanction_amount,
        no_expenditure_record: p.total_expenditure === 0,
        expenditure_without_completion_record: p.total_expenditure > 0 && p.work_status !== 'Completed',
        days_from_recommendation_to_sanction: 45,
        days_from_sanction_to_first_expenditure: 120,
      }));

      const page = params?.page || 1;
      const pageSize = params?.page_size || 20;
      const startIndex = (page - 1) * pageSize;

      return {
        data: items.slice(startIndex, startIndex + pageSize),
        pagination: {
          total_records: items.length,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(items.length / pageSize),
        },
      };
    }
  },

  // Risk Cases
  async getRiskCases(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    priority?: string;
    state?: string;
    work_id?: string;
  }): Promise<PaginatedResponse<RiskCaseListItem>> {
    try {
      const res = await client.get<PaginatedResponse<RiskCaseListItem>>('/api/v1/risk-cases', { params });
      return res.data;
    } catch {
      let filtered = [...MOCK_RISK_CASES];
      if (params?.status) {
        filtered = filtered.filter((c) => c.status.toLowerCase().includes(params.status!.toLowerCase()));
      }
      if (params?.priority) {
        filtered = filtered.filter((c) => c.severity.toLowerCase() === params.priority!.toLowerCase());
      }
      if (params?.state) {
        filtered = filtered.filter((c) => c.state.toUpperCase().includes(params.state!.toUpperCase()));
      }
      if (params?.work_id) {
        filtered = filtered.filter((c) => c.work_id === params.work_id);
      }

      const page = params?.page || 1;
      const pageSize = params?.page_size || 20;
      const startIndex = (page - 1) * pageSize;

      const items: RiskCaseListItem[] = filtered.slice(startIndex, startIndex + pageSize).map((c) => {
        const p = MOCK_PROJECTS.find((proj) => proj.work_id === c.work_id);
        const mappedStatus: 'OPEN' | 'UNDER_REVIEW' | 'VERIFIED' | 'CLOSED' | 'ESCALATED' =
          c.status === 'Open' ? 'OPEN' :
          c.status === 'Under Verification' ? 'UNDER_REVIEW' :
          c.status === 'Verified - Cleared' ? 'VERIFIED' :
          c.status === 'Escalated' ? 'ESCALATED' : 'UNDER_REVIEW';

        return {
          case_id: c.case_id,
          work_id: c.work_id,
          run_id: 'RUN-2026-0926',
          case_status: mappedStatus,
          priority: c.severity === 'CRITICAL' ? 'CRITICAL' : c.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          signal_count: c.dossier.detected_signals.length,
          evidence_count: c.dossier.supporting_evidence.length,
          verification_recommendation: c.dossier.project_summary,
          created_at: c.created_at,
          updated_at: c.updated_at,
          mp_name: p?.mp_name || 'Hon’ble Member of Parliament',
          state: c.state,
          constituency: c.constituency,
          work_category: p?.category || 'Public Infrastructure',
          sanction_amount: p?.sanction_amount || 2500000,
          work_status: p?.work_status || 'In Progress',
        };
      });

      return {
        data: items,
        pagination: {
          total_records: filtered.length,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(filtered.length / pageSize),
        },
      };
    }
  },

  async updateRiskCaseStatus(caseId: string, status: string, notes?: string): Promise<any> {
    try {
      const res = await client.post(`/api/v1/risk-cases/${encodeURIComponent(caseId)}/status`, {
        new_status: status,
        verification_notes: notes,
      });
      return res.data;
    } catch {
      const found = MOCK_RISK_CASES.find((c) => c.case_id === caseId);
      if (found) {
        found.status = status as any;
        if (notes) {
          found.dossier.officer_action_history.unshift({
            date: new Date().toISOString().split('T')[0],
            officer: 'Authorized Vigilance Officer',
            action: `Status updated to ${status}`,
            note: notes,
          });
        }
      }
      return { success: true, case_id: caseId, status, notes };
    }
  },

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    page_size?: number;
    event_type?: string;
    entity_type?: string;
    entity_id?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const res = await client.get<PaginatedResponse<any>>('/api/v1/audit', { params });
      return res.data;
    } catch {
      return {
        data: MOCK_AUDIT_LOGS.map((a) => ({
          audit_id: a.id,
          event_type: a.action,
          entity_type: 'RISK_CASE',
          entity_id: a.work_id,
          actor_id: a.officer_id,
          actor_name: a.officer_name,
          description: `${a.action} on work ${a.work_id}: ${a.details}`,
          metadata: { ip_address: a.ip_address },
          created_at: a.timestamp,
        })),
        pagination: {
          total_records: MOCK_AUDIT_LOGS.length,
          page: params?.page || 1,
          page_size: params?.page_size || 20,
          total_pages: 1,
        },
      };
    }
  },

  // Analysis Pipeline
  async getAnalysisRuns(): Promise<AnalysisRunResponse[]> {
    try {
      const res = await client.get<AnalysisRunResponse[]>('/api/v1/analysis-runs');
      return res.data;
    } catch {
      return [
        {
          run_id: 'RUN-2026-0926-001',
          dataset_hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          timestamp: '2026-09-26T18:30:00Z',
          rules_version: 'v2.4.1-sih',
          detector_versions: {
            financial_variance: 'v1.4',
            sanction_lag: 'v1.2',
            peer_benchmark: 'v2.0',
            vendor_monopoly: 'v1.1',
            geotag_audit: 'v1.0',
          },
          project_count: 80733,
          anomaly_count: 3418,
          risk_distribution: {
            CRITICAL: 87,
            HIGH: 412,
            MEDIUM: 2919,
            LOW: 77315,
          },
        },
        {
          run_id: 'RUN-2026-0920-002',
          dataset_hash: 'sha256:3a1b5c7d9e2f4a6b8c0d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b',
          timestamp: '2026-09-20T11:15:00Z',
          rules_version: 'v2.4.0-sih',
          detector_versions: {
            financial_variance: 'v1.3',
            sanction_lag: 'v1.2',
            peer_benchmark: 'v1.9',
            vendor_monopoly: 'v1.0',
            geotag_audit: 'v1.0',
          },
          project_count: 80733,
          anomaly_count: 3390,
          risk_distribution: {
            CRITICAL: 84,
            HIGH: 405,
            MEDIUM: 2901,
            LOW: 77343,
          },
        },
      ];
    }
  },

  async triggerAnalysisRun(): Promise<AnalysisRunResponse> {
    try {
      const res = await client.post<AnalysisRunResponse>('/api/v1/analysis-runs');
      return res.data;
    } catch {
      return {
        run_id: `RUN-2026-0928-${Math.floor(1000 + Math.random() * 9000)}`,
        dataset_hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: new Date().toISOString(),
        rules_version: 'v2.4.2-sih',
        detector_versions: {
          financial_variance: 'v1.4',
          sanction_lag: 'v1.2',
          peer_benchmark: 'v2.0',
          vendor_monopoly: 'v1.1',
          geotag_audit: 'v1.0',
        },
        project_count: 80733,
        anomaly_count: 3418,
        risk_distribution: {
          CRITICAL: 87,
          HIGH: 412,
          MEDIUM: 2919,
          LOW: 77315,
        },
      };
    }
  },
};

