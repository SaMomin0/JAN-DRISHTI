// JAN-DRISHTI Structured Mock Data Store
// Provides realistic, isolated data for all 18 SIH platform pages

export interface Project {
  work_id: string;
  title: string;
  category: string;
  state: string;
  district: string;
  constituency: string;
  mp_name: string;
  sanction_amount: number; // in INR
  total_expenditure: number; // in INR
  financial_year: string;
  sanction_date: string;
  target_completion_date: string;
  actual_completion_date?: string;
  work_status: 'Completed' | 'In Progress' | 'Delayed' | 'Sanctioned' | 'Stalled';
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_score: number; // 0 to 100
  signals_count: number;
  signals: {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    metric: string;
  }[];
  coordinates: [number, number]; // [lat, lng]
  implementing_agency: string;
  physical_progress_pct: number;
  financial_progress_pct: number;
}

export interface RiskCase {
  case_id: string;
  work_id: string;
  title: string;
  state: string;
  district: string;
  constituency: string;
  primary_signal: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'Open' | 'Under Verification' | 'Pending Counter-Evidence' | 'Verified - Cleared' | 'Escalated';
  risk_score: number;
  assigned_officer: string;
  created_at: string;
  updated_at: string;
  dossier: {
    project_summary: string;
    detected_signals: { title: string; detail: string; score: number }[];
    supporting_evidence: { title: string; doc_ref: string; date: string }[];
    comparable_peers: { work_id: string; location: string; amount: number; variance: string }[];
    counter_evidence: { source: string; claim: string; validity: 'VALIDATED' | 'UNDER_REVIEW' | 'UNSUBSTANTIATED' }[];
    data_limitations: string[];
    verification_checklist: { checkpoint: string; verified: boolean; notes: string }[];
    officer_action_history: { date: string; officer: string; action: string; note: string }[];
  };
}

export interface EvidenceItem {
  id: string;
  work_id: string;
  doc_title: string;
  category: 'Sanction Order' | 'Expenditure Voucher' | 'Completion Certificate' | 'Geotagged Photo' | 'Field Report';
  uploaded_by: string;
  upload_date: string;
  file_size: string;
  file_type: 'PDF' | 'JPG' | 'PNG' | 'XLSX';
  verification_status: 'VERIFIED' | 'PENDING' | 'DISPUTED';
  sha256_hash: string;
  download_url?: string;
}

export interface VerificationTask {
  task_id: string;
  work_id: string;
  title: string;
  location: string;
  priority: 'URGENT' | 'HIGH' | 'ROUTINE';
  status: 'Scheduled' | 'Field Visit Completed' | 'Report Submitted' | 'Closed';
  assigned_inspector: string;
  deadline: string;
  checkpoints: { item: string; status: 'Passed' | 'Failed' | 'Pending' }[];
  findings_summary?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action_type: 'LOGIN' | 'RISK_SCORE_OVERRIDE' | 'EXPORT_DOSSIER' | 'INSPECTION_NOTE_ADDED' | 'DATASET_INGESTED' | 'STATUS_CHANGED';
  target_entity: string;
  ip_address: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FLAGGED';
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  read: boolean;
  link: string;
  category: 'Risk Signal' | 'Inspection' | 'Data Pipeline' | 'System';
}

export const MOCK_PROJECTS: Project[] = [
  {
    work_id: 'MPLADS-UP-VAR-2024-001',
    title: 'Construction of Multipurpose Rural Community Hall with Solar Rooftop',
    category: 'Community Infrastructure',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    mp_name: 'Shri Narendra Modi',
    sanction_amount: 5480000,
    total_expenditure: 5240000,
    financial_year: '2024-25',
    sanction_date: '2023-11-14',
    target_completion_date: '2024-05-14',
    actual_completion_date: undefined,
    work_status: 'Delayed',
    risk_level: 'CRITICAL',
    risk_score: 94,
    signals_count: 3,
    signals: [
      { type: 'Cost Anomaly', severity: 'CRITICAL', description: 'Unit cost variance +144% higher than regional baseline', metric: 'Z = +3.42' },
      { type: 'Timeline Drift', severity: 'HIGH', description: 'Execution exceeded original target by 312 days', metric: '+312 Days' },
      { type: 'Progress Mismatch', severity: 'HIGH', description: 'Financial expenditure at 95.6% while physical inspection indicates 42% completion', metric: '53.6% Gap' }
    ],
    coordinates: [25.3176, 82.9739],
    implementing_agency: 'Rural Engineering Department (RED), UP',
    physical_progress_pct: 42,
    financial_progress_pct: 95.6
  },
  {
    work_id: 'MPLADS-MH-PUN-2023-042',
    title: 'High-Density Rural Bituminous Road Renovation - Phase II',
    category: 'Roads & Pathways',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Baramati',
    mp_name: 'Smt. Supriya Sule',
    sanction_amount: 3850000,
    total_expenditure: 3820000,
    financial_year: '2023-24',
    sanction_date: '2023-04-10',
    target_completion_date: '2023-10-10',
    actual_completion_date: undefined,
    work_status: 'In Progress',
    risk_level: 'CRITICAL',
    risk_score: 91,
    signals_count: 2,
    signals: [
      { type: 'Potentially Similar Work', severity: 'CRITICAL', description: '94.2% semantic description match with contiguous tender #48109', metric: 'Cosine: 0.942' },
      { type: 'Split Tender Suspicion', severity: 'HIGH', description: 'Identical road stretch split into consecutive sanctions below ₹40L tender threshold', metric: '0.8 km Overlap' }
    ],
    coordinates: [18.5204, 73.8567],
    implementing_agency: 'Public Works Department (PWD), Pune Division',
    physical_progress_pct: 68,
    financial_progress_pct: 99.2
  },
  {
    work_id: 'MPLADS-BR-PAT-2024-018',
    title: 'Deep Borewell Solar Drinking Water RO Purification Facility',
    category: 'Drinking Water & Sanitation',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib',
    mp_name: 'Shri Ravi Shankar Prasad',
    sanction_amount: 2200000,
    total_expenditure: 880000,
    financial_year: '2024-25',
    sanction_date: '2023-08-20',
    target_completion_date: '2024-02-20',
    work_status: 'Stalled',
    risk_level: 'HIGH',
    risk_score: 78,
    signals_count: 2,
    signals: [
      { type: 'Timeline Deviation', severity: 'HIGH', description: 'Work stalled for 280+ days post initial tranche release', metric: '+280 Days Dormant' },
      { type: 'Payment Velocity', severity: 'MEDIUM', description: 'First disbursement cleared without subsequent contractor milestone validation', metric: 'Tranche 1 unverified' }
    ],
    coordinates: [25.5941, 85.1376],
    implementing_agency: 'Public Health Engineering Department (PHED)',
    physical_progress_pct: 25,
    financial_progress_pct: 40.0
  },
  {
    work_id: 'MPLADS-RJ-JAI-2024-055',
    title: 'Smart Science Classroom & Digital Lab Facility at Govt Senior Secondary School',
    category: 'Education & Schools',
    state: 'Rajasthan',
    district: 'Jaipur',
    constituency: 'Jaipur Rural',
    mp_name: 'Col. Rajyavardhan Rathore',
    sanction_amount: 1750000,
    total_expenditure: 1720000,
    financial_year: '2024-25',
    sanction_date: '2024-01-15',
    target_completion_date: '2024-07-15',
    actual_completion_date: '2024-08-01',
    work_status: 'Completed',
    risk_level: 'LOW',
    risk_score: 18,
    signals_count: 0,
    signals: [],
    coordinates: [26.9124, 75.7873],
    implementing_agency: 'Rajasthan State Educational Infrastructure Board',
    physical_progress_pct: 100,
    financial_progress_pct: 98.3
  },
  {
    work_id: 'MPLADS-KA-BLR-2023-091',
    title: 'Installation of High-Mast LED Lighting & Surveillance Mast at Market Junction',
    category: 'Community Infrastructure',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    constituency: 'Bangalore South',
    mp_name: 'Shri Tejasvi Surya',
    sanction_amount: 1450000,
    total_expenditure: 1440000,
    financial_year: '2023-24',
    sanction_date: '2023-09-05',
    target_completion_date: '2024-01-05',
    actual_completion_date: '2024-01-12',
    work_status: 'Completed',
    risk_level: 'LOW',
    risk_score: 12,
    signals_count: 0,
    signals: [],
    coordinates: [12.9716, 77.5946],
    implementing_agency: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    physical_progress_pct: 100,
    financial_progress_pct: 99.3
  },
  {
    work_id: 'MPLADS-KL-TVM-2024-012',
    title: 'Primary Health Sub-Centre Diagnostic & Telemedicine Upgradation',
    category: 'Health & Family Welfare',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    constituency: 'Thiruvananthapuram',
    mp_name: 'Dr. Shashi Tharoor',
    sanction_amount: 2850000,
    total_expenditure: 1950000,
    financial_year: '2024-25',
    sanction_date: '2024-02-18',
    target_completion_date: '2024-09-18',
    work_status: 'In Progress',
    risk_level: 'MEDIUM',
    risk_score: 54,
    signals_count: 1,
    signals: [
      { type: 'Payment Cadence', severity: 'MEDIUM', description: 'Equipment delivery invoice pending verification against asset register', metric: '₹9.0L Pending Audit' }
    ],
    coordinates: [8.5241, 76.9366],
    implementing_agency: 'National Health Mission (NHM) Kerala',
    physical_progress_pct: 70,
    financial_progress_pct: 68.4
  },
  {
    work_id: 'MPLADS-WB-KOL-2023-088',
    title: 'Stormwater Concrete Drainage Channel Rehabilitation - Ward 44',
    category: 'Drinking Water & Sanitation',
    state: 'West Bengal',
    district: 'Kolkata',
    constituency: 'Kolkata South',
    mp_name: 'Smt. Mala Roy',
    sanction_amount: 4200000,
    total_expenditure: 4180000,
    financial_year: '2023-24',
    sanction_date: '2023-05-12',
    target_completion_date: '2023-11-12',
    work_status: 'Delayed',
    risk_level: 'HIGH',
    risk_score: 82,
    signals_count: 2,
    signals: [
      { type: 'Cost Anomaly', severity: 'HIGH', description: 'Expenditure per running meter 82% above municipal scheduled rates', metric: 'Z = +2.61' },
      { type: 'Timeline Deviation', severity: 'MEDIUM', description: 'Completion statement submitted 220 days after fund exhaust', metric: '+220 Days' }
    ],
    coordinates: [22.5726, 88.3639],
    implementing_agency: 'Kolkata Municipal Corporation (KMC)',
    physical_progress_pct: 85,
    financial_progress_pct: 99.5
  },
  {
    work_id: 'MPLADS-MP-IND-2024-031',
    title: 'Agricultural Produce Cold Storage Shed & Loading Bay at Krishi Mandi',
    category: 'Community Infrastructure',
    state: 'Madhya Pradesh',
    district: 'Indore',
    constituency: 'Indore',
    mp_name: 'Shri Shankar Lalwani',
    sanction_amount: 3200000,
    total_expenditure: 3120000,
    financial_year: '2024-25',
    sanction_date: '2023-12-05',
    target_completion_date: '2024-06-05',
    work_status: 'Completed',
    risk_level: 'LOW',
    risk_score: 22,
    signals_count: 0,
    signals: [],
    coordinates: [22.7196, 75.8577],
    implementing_agency: 'Mandi Board Infrastructure Wing, MP',
    physical_progress_pct: 100,
    financial_progress_pct: 97.5
  }
];

export const MOCK_RISK_CASES: RiskCase[] = [
  {
    case_id: 'RC-2026-0842',
    work_id: 'MPLADS-UP-VAR-2024-001',
    title: 'Multi-Pillar Cost & Timeline Variance: Rural Community Hall Complex',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    primary_signal: 'Cost Anomaly (Z = +3.42)',
    severity: 'CRITICAL',
    status: 'Under Verification',
    risk_score: 94,
    assigned_officer: 'Shri A. K. Sharma (District Monitoring Officer)',
    created_at: '2026-02-12',
    updated_at: '2026-09-24',
    dossier: {
      project_summary: 'Sanctioned under Community Assets for ₹54.80 Lakhs. Current financial expenditure stands at ₹52.40 Lakhs (95.6%), but preliminary satellite audit reports only partial perimeter wall erection with 42% physical progress.',
      detected_signals: [
        { title: 'Extreme Cost Outlier', detail: 'Sanction amount exceeds 99th percentile of community hall works across Purvanchal division.', score: 96 },
        { title: 'Severe Execution Lag', detail: 'Scheduled for 180 days; currently active for 492 days without formal extension order.', score: 88 },
        { title: 'Frontloaded Financial Disbursal', detail: 'Final tranche disbursed before physical milestone certificate was uploaded.', score: 92 }
      ],
      supporting_evidence: [
        { title: 'District Sanction Order #VAR/MPLADS/2023/1844', doc_ref: 'SO-1844.pdf', date: '2023-11-14' },
        { title: 'Bank Disbursal Register Tranche #1 & #2', doc_ref: 'BDR-9921.xlsx', date: '2024-01-20' },
        { title: 'Satellite Geo-Imagery Structural Analysis', doc_ref: 'GEO-VAR-001.jpg', date: '2026-01-15' }
      ],
      comparable_peers: [
        { work_id: 'MPLADS-UP-GZP-2023-019', location: 'Ghazipur (Adjacent)', amount: 2280000, variance: '-58.4%' },
        { work_id: 'MPLADS-UP-JNP-2024-008', location: 'Jaunpur', amount: 2450000, variance: '-55.3%' },
        { work_id: 'MPLADS-UP-VAR-2022-094', location: 'Varanasi (Peetambarpur)', amount: 2190000, variance: '-60.0%' }
      ],
      counter_evidence: [
        { source: 'Implementing Agency RED Notice', claim: 'Soil conditions required specialized micro-piling foundation.', validity: 'UNDER_REVIEW' },
        { source: 'Calamity Fund Cross-Reference', claim: 'No natural disaster reallocation recorded in district ledger.', validity: 'UNSUBSTANTIATED' }
      ],
      data_limitations: [
        'Geotagged photographic records for structural column casting are missing from portal.',
        'Third-party quality inspection report by IIT-BHU civil wing is pending.'
      ],
      verification_checklist: [
        { checkpoint: 'Verify foundation depth and micro-piling logs', verified: false, notes: 'Requires sub-surface ultrasonic testing.' },
        { checkpoint: 'Audit solar panel invoice against rooftop inventory', verified: false, notes: 'Solar panels not spotted in drone review.' },
        { checkpoint: 'Confirm vendor bank account beneficiary identity', verified: true, notes: 'Vendor registered with MSME portal.' }
      ],
      officer_action_history: [
        { date: '2026-02-12', officer: 'System Engine', action: 'Flagged Anomaly', note: 'Z-score threshold exceeded +3.0σ limit.' },
        { date: '2026-02-18', officer: 'Shri A. K. Sharma', action: 'Initiated Investigation', note: 'Notice served to Executive Engineer, RED.' },
        { date: '2026-09-20', officer: 'Shri A. K. Sharma', action: 'Field Inspection Scheduled', note: 'Joint inspection scheduled for Oct 2, 2026.' }
      ]
    }
  },
  {
    case_id: 'RC-2026-0719',
    work_id: 'MPLADS-MH-PUN-2023-042',
    title: 'Suspected Split-Tender Scope Duplication on Contiguous Road Link',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Baramati',
    primary_signal: 'Semantic Overlap (Cosine = 0.942)',
    severity: 'CRITICAL',
    status: 'Open',
    risk_score: 91,
    assigned_officer: 'Smt. P. Deshmukh (Deputy Collector, Monitoring)',
    created_at: '2026-03-04',
    updated_at: '2026-09-22',
    dossier: {
      project_summary: 'Consecutive sanctions #48102 (₹38.5L) and #48109 (₹39.2L) describe identical work specifications along a 1.6 km rural stretch. Potential avoidance of Chief Engineer technical sanction threshold at ₹40 Lakhs.',
      detected_signals: [
        { title: 'High Text Similarity', detail: 'Tender scope matches 94.2% with adjoining contract awarded to same sub-contractor.', score: 94 },
        { title: 'Contiguous Coordinates', detail: 'Starting GPS coordinate matches terminus GPS coordinate of work #48109.', score: 90 }
      ],
      supporting_evidence: [
        { title: 'Detailed Project Report (DPR) Road Link B', doc_ref: 'DPR-MH-48102.pdf', date: '2023-03-28' },
        { title: 'Contractor Work Award Agreement', doc_ref: 'AGR-PUN-091.pdf', date: '2023-04-12' }
      ],
      comparable_peers: [
        { work_id: 'MPLADS-MH-SAT-2023-011', location: 'Satara', amount: 3750000, variance: '-2.6%' }
      ],
      counter_evidence: [
        { source: 'PWD Executive Engineer Clarification', claim: 'Road spans two separate gram panchayats with differing road base specifications.', validity: 'UNDER_REVIEW' }
      ],
      data_limitations: [
        'Boundary demarcation maps between gram panchayats are not digitised.'
      ],
      verification_checklist: [
        { checkpoint: 'Inspect physical road chainage markers 0/0 to 1/6', verified: false, notes: 'Pending physical visit' }
      ],
      officer_action_history: [
        { date: '2026-03-04', officer: 'System Engine', action: 'Flagged Duplicate Vector', note: 'Sentence-BERT vector distance < 0.08.' }
      ]
    }
  }
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-88912',
    timestamp: '2026-09-28 17:42:10 IST',
    actor_name: 'Shri R. K. Mathur',
    actor_role: 'Director (MPLADS), MoSPI',
    action_type: 'EXPORT_DOSSIER',
    target_entity: 'Case #RC-2026-0842',
    ip_address: '10.24.110.82',
    details: 'Exported comprehensive evidence dossier in encrypted PDF format for Parliamentary Public Accounts Committee review.',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-88911',
    timestamp: '2026-09-28 16:30:05 IST',
    actor_name: 'Shri A. K. Sharma',
    actor_role: 'District Collector / Monitoring Officer',
    action_type: 'INSPECTION_NOTE_ADDED',
    target_entity: 'Work #MPLADS-UP-VAR-2024-001',
    ip_address: '10.45.12.19',
    details: 'Logged physical inspection notice to RED Executive Engineer regarding solar rooftop non-installation.',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-88910',
    timestamp: '2026-09-28 15:15:40 IST',
    actor_name: 'System Daemon',
    actor_role: 'Automated Pipeline Engine',
    action_type: 'DATASET_INGESTED',
    target_entity: 'Batch #2026-Q3-UP-BR-MH',
    ip_address: '127.0.0.1',
    details: 'Validated and ingested 14,208 works records from MoSPI raw portal. 34 records flagged for missing sanction date.',
    status: 'WARNING'
  },
  {
    id: 'LOG-88909',
    timestamp: '2026-09-28 14:02:18 IST',
    actor_name: 'Smt. P. Deshmukh',
    actor_role: 'Deputy Collector (Monitoring)',
    action_type: 'STATUS_CHANGED',
    target_entity: 'Case #RC-2026-0719',
    ip_address: '10.33.204.61',
    details: 'Updated case status from "Open" to "Under Verification". Field investigator appointed.',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-88908',
    timestamp: '2026-09-28 11:20:00 IST',
    actor_name: 'Dr. Vivek Menon',
    actor_role: 'Senior Statistical Officer',
    action_type: 'RISK_SCORE_OVERRIDE',
    target_entity: 'Work #MPLADS-KL-TVM-2024-012',
    ip_address: '10.24.110.45',
    details: 'Adjusted model risk score from 68 to 54 after receiving valid telemedicine asset delivery dispatch slips.',
    status: 'FLAGGED'
  },
  {
    id: 'LOG-88907',
    timestamp: '2026-09-28 09:00:12 IST',
    actor_name: 'Shri R. K. Mathur',
    actor_role: 'Director (MPLADS), MoSPI',
    action_type: 'LOGIN',
    target_entity: 'Session #SESS-2026-0928-01',
    ip_address: '10.24.110.82',
    details: 'Secure biometric + OTP multi-factor authentication validated.',
    status: 'SUCCESS'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    timestamp: '10 minutes ago',
    severity: 'CRITICAL',
    title: 'High Risk Anomaly Flagged in Varanasi',
    message: 'Work #MPLADS-UP-VAR-2024-001 has triggered Z = +3.42 cost outlier with a 53.6% physical-financial mismatch.',
    read: false,
    link: '/risk/RC-2026-0842',
    category: 'Risk Signal'
  },
  {
    id: 'NOTIF-02',
    timestamp: '1 hour ago',
    severity: 'CRITICAL',
    title: 'Duplicate Tender Cluster in Pune',
    message: '94.2% semantic scope overlap detected between contiguous road works #48102 and #48109.',
    read: false,
    link: '/risk/RC-2026-0719',
    category: 'Risk Signal'
  },
  {
    id: 'NOTIF-03',
    timestamp: '3 hours ago',
    severity: 'WARNING',
    title: 'Field Audit Deadline Approaching',
    message: 'Verification report for Patna Solar RO project is due within 48 hours for District Collector review.',
    read: false,
    link: '/verification',
    category: 'Inspection'
  },
  {
    id: 'NOTIF-04',
    timestamp: 'Yesterday',
    severity: 'INFO',
    title: 'Quarterly Ingestion Pipeline Complete',
    message: 'All 80,733 records refreshed with latest expenditure ledger data from state treasuries.',
    read: true,
    link: '/analysis',
    category: 'Data Pipeline'
  }
];

export const MOCK_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'EVD-901',
    work_id: 'MPLADS-UP-VAR-2024-001',
    doc_title: 'Official Sanction Order with Technical Sanction Estimate',
    category: 'Sanction Order',
    uploaded_by: 'RED Varanasi Office',
    upload_date: '2023-11-14',
    file_size: '2.4 MB',
    file_type: 'PDF',
    verification_status: 'VERIFIED',
    sha256_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  },
  {
    id: 'EVD-902',
    work_id: 'MPLADS-UP-VAR-2024-001',
    doc_title: 'Drone Inspection Aerial Photo Series (Pre-Roofing)',
    category: 'Geotagged Photo',
    uploaded_by: 'District Field Audit Unit',
    upload_date: '2026-01-15',
    file_size: '14.8 MB',
    file_type: 'JPG',
    verification_status: 'VERIFIED',
    sha256_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  },
  {
    id: 'EVD-903',
    work_id: 'MPLADS-UP-VAR-2024-001',
    doc_title: 'Treasury Fund Release Disbursal Voucher #TR-8819',
    category: 'Expenditure Voucher',
    uploaded_by: 'Treasury Officer Varanasi',
    upload_date: '2024-01-20',
    file_size: '850 KB',
    file_type: 'PDF',
    verification_status: 'VERIFIED',
    sha256_hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
  },
  {
    id: 'EVD-904',
    work_id: 'MPLADS-MH-PUN-2023-042',
    doc_title: 'Road Chainage Survey and Asphalt Core Test Report',
    category: 'Field Report',
    uploaded_by: 'Government Engineering College Pune',
    upload_date: '2024-02-11',
    file_size: '5.1 MB',
    file_type: 'PDF',
    verification_status: 'PENDING',
    sha256_hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
  },
  {
    id: 'EVD-905',
    work_id: 'MPLADS-BR-PAT-2024-018',
    doc_title: 'Groundwater Depth & Water Quality Test Lab Certificate',
    category: 'Field Report',
    uploaded_by: 'PHED Water Testing Lab',
    upload_date: '2023-09-02',
    file_size: '1.2 MB',
    file_type: 'PDF',
    verification_status: 'VERIFIED',
    sha256_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
  }
];

export const MOCK_EVIDENCE = MOCK_EVIDENCE_ITEMS;

export const MOCK_VERIFICATIONS: VerificationTask[] = [
  {
    task_id: 'VER-001',
    work_id: 'MPLADS-UP-VAR-2024-001',
    title: 'Physical Audit: Varanasi Community Hall Foundation & Solar Spec',
    location: 'Chiraigaon Block, Varanasi District',
    priority: 'URGENT',
    status: 'Scheduled',
    assigned_inspector: 'Er. Sandeep Verma (Asst Engineer, PWD)',
    deadline: '2026-10-05',
    checkpoints: [
      { item: 'Verify RCC Column Quality and Plinth Dimensions', status: 'Pending' },
      { item: 'Inspect 5kW Solar Rooftop Installation & Grid Inverter', status: 'Failed' },
      { item: 'Cross-examine Labor Attendance Rolls with Wage Disbursals', status: 'Pending' },
      { item: 'Verify Geotag Coordinates with Approved DPR Map', status: 'Passed' }
    ],
    findings_summary: 'Preliminary site inspection indicates partial column casting. Solar system not found on site despite 100% equipment payout.'
  },
  {
    task_id: 'VER-002',
    work_id: 'MPLADS-MH-PUN-2023-042',
    title: 'Contiguous Chainage Inspection: Baramati Road Link',
    location: 'Baramati Taluk, Pune District',
    priority: 'HIGH',
    status: 'Field Visit Completed',
    assigned_inspector: 'Smt. Kavita Patil (Sub-Divisional Officer)',
    deadline: '2026-10-10',
    checkpoints: [
      { item: 'Measure Road Width & Bituminous Thickness at 100m Intervals', status: 'Passed' },
      { item: 'Verify Physical Boundary between Contract 48102 and 48109', status: 'Failed' },
      { item: 'Examine Culvert Construction Invoices', status: 'Passed' }
    ],
    findings_summary: 'Road was executed continuously as a single tender. No physical or technical basis found for splitting into two sub-contracts.'
  },
  {
    task_id: 'VER-003',
    work_id: 'MPLADS-BR-PAT-2024-018',
    title: 'Operational Verification: Solar Drinking Water RO Plant',
    location: 'Danapur Block, Patna District',
    priority: 'ROUTINE',
    status: 'Scheduled',
    assigned_inspector: 'Shri Manoj Kumar (Junior Engineer, PHED)',
    deadline: '2026-10-18',
    checkpoints: [
      { item: 'Test Daily Water Output Volume (Target: 1,000 LPH)', status: 'Pending' },
      { item: 'Verify Submersible Pump Voltage and Solar Inverter', status: 'Pending' },
      { item: 'Review Gram Panchayat Handover Resolution', status: 'Pending' }
    ]
  }
];

export const MOCK_REPORTS = [
  {
    id: 'REP-01',
    title: 'Executive Risk Intelligence Briefing — Purvanchal Division',
    category: 'Executive Summary',
    period: 'FY 2024-25 Q2',
    generated_by: 'AI Risk Engine',
    file_size: '3.8 MB',
    date: '2026-09-27',
    format: 'PDF',
    downloads: 142
  },
  {
    id: 'REP-02',
    title: 'National Cost Outlier Synthesis Report (Z > +2.5σ)',
    category: 'Anomaly Triage',
    period: 'All Active Works (80,733 Works)',
    generated_by: 'MoSPI Analytical Unit',
    file_size: '12.4 MB',
    date: '2026-09-25',
    format: 'PDF',
    downloads: 389
  },
  {
    id: 'REP-03',
    title: 'Suspected Split-Tenders and Semantic Duplicate Digest',
    category: 'Integrity Review',
    period: 'FY 2023-24 to 2024-25',
    generated_by: 'Sentence-BERT NLP Model',
    file_size: '6.2 MB',
    date: '2026-09-20',
    format: 'CSV',
    downloads: 210
  },
  {
    id: 'REP-04',
    title: 'Field Verification Audit Trail & Resolution Log',
    category: 'Audit Compliance',
    period: 'Last 90 Days',
    generated_by: 'Officer Workbench',
    file_size: '1.9 MB',
    date: '2026-09-18',
    format: 'JSON',
    downloads: 95
  }
];

export const MOCK_ANALYTICS = {
  total_works: 80733,
  total_sanction_amount: 148200000000, // ₹14,820 Cr
  total_expenditure_amount: 114500000000, // ₹11,450 Cr
  expenditure_utilization_rate: 77.2,
  flagged_works_count: 3418,
  high_risk_cases: 412,
  critical_risk_cases: 87,
  resolved_cases: 1940,
  average_timeline_delay_days: 142,
  
  category_distribution: [
    { name: 'Roads & Pathways', value: 34, amount: '₹5,038 Cr', count: 27449 },
    { name: 'Community Infrastructure', value: 24, amount: '₹3,556 Cr', count: 19375 },
    { name: 'Drinking Water & Sanitation', value: 18, amount: '₹2,667 Cr', count: 14531 },
    { name: 'Education & Schools', value: 14, amount: '₹2,074 Cr', count: 11302 },
    { name: 'Health & Family Welfare', value: 7, amount: '₹1,037 Cr', count: 5651 },
    { name: 'Irrigation & Others', value: 3, amount: '₹444 Cr', count: 2425 }
  ],

  quarterly_velocity: [
    { quarter: '2023 Q1', sanctions: 18.2, expenditure: 14.1, flagged: 3.4 },
    { quarter: '2023 Q2', sanctions: 24.5, expenditure: 19.8, flagged: 4.1 },
    { quarter: '2023 Q3', sanctions: 21.0, expenditure: 17.5, flagged: 3.8 },
    { quarter: '2023 Q4', sanctions: 32.4, expenditure: 28.2, flagged: 6.2 },
    { quarter: '2024 Q1', sanctions: 19.5, expenditure: 16.4, flagged: 3.1 },
    { quarter: '2024 Q2', sanctions: 26.8, expenditure: 22.0, flagged: 4.9 },
    { quarter: '2024 Q3', sanctions: 28.4, expenditure: 24.1, flagged: 5.4 }
  ],

  state_risk_league: [
    { state: 'Uttar Pradesh', works: 14208, total_amt: 2840, avg_risk: 68.4, high_risk: 94 },
    { state: 'Maharashtra', works: 11840, total_amt: 2368, avg_risk: 62.1, high_risk: 76 },
    { state: 'Bihar', works: 9850, total_amt: 1970, avg_risk: 74.2, high_risk: 88 },
    { state: 'West Bengal', works: 8420, total_amt: 1684, avg_risk: 65.8, high_risk: 52 },
    { state: 'Madhya Pradesh', works: 7650, total_amt: 1530, avg_risk: 48.2, high_risk: 34 },
    { state: 'Rajasthan', works: 6920, total_amt: 1384, avg_risk: 42.5, high_risk: 28 },
    { state: 'Karnataka', works: 6140, total_amt: 1228, avg_risk: 39.8, high_risk: 22 },
    { state: 'Kerala', works: 4800, total_amt: 960, avg_risk: 34.2, high_risk: 18 }
  ]
};
