'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../services/api';
import { 
  ProjectDetail, 
  ProjectRiskResponse, 
  AnomalyResponse, 
  EvidenceResponse, 
  ComparableProjectResponse, 
  ProjectHistoryResponse 
} from '../../../types';
import { 
  ArrowLeft, 
  Building2, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Users, 
  Activity,
  Printer,
  ChevronRight,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { APPLE_PALETTE } from '../../../components/charts/AppleCharts';

export default function ProjectDetailRoomPage() {
  const params = useParams();
  const workId = decodeURIComponent(params?.id as string);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [risk, setRisk] = useState<ProjectRiskResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResponse[]>([]);
  const [evidence, setEvidence] = useState<EvidenceResponse[]>([]);
  const [comparables, setComparables] = useState<ComparableProjectResponse[]>([]);
  const [history, setHistory] = useState<ProjectHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) return;

    const loadProjectDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pData, rData, aData, eData, cData, hData] = await Promise.all([
          api.getProjectById(workId).catch(() => null),
          api.getProjectRisk(workId).catch(() => null),
          api.getProjectAnomalies(workId).catch(() => []),
          api.getProjectEvidence(workId).catch(() => []),
          api.getProjectComparables(workId).catch(() => []),
          api.getProjectHistory(workId).catch(() => null),
        ]);

        if (!pData) {
          setError(`Project record '${workId}' was not found in the database.`);
        } else {
          setProject(pData);
          setRisk(rData);
          setAnomalies(aData);
          setEvidence(eData);
          setComparables(cData);
          setHistory(hData);
        }
      } catch (err: any) {
        console.error('Error loading project investigation data:', err);
        setError(err.message || 'Failed to fetch project investigation records');
      } finally {
        setLoading(false);
      }
    };

    loadProjectDetails();
  }, [workId]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Activity className="w-8 h-8 text-[rgb(26,26,26)] animate-spin mx-auto opacity-70" />
        <p className="text-[#6e6e73] text-sm font-medium">Synthesizing project dossier and cross-referencing audit signals for Work #{workId}...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link href="/projects" className="inline-flex items-center space-x-2 text-xs text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Directory</span>
        </Link>
        <div className="bg-white border border-black/5 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-[#FFADAD] mx-auto" />
          <h2 className="text-base font-semibold text-[rgb(26,26,26)]">Project Not Found</h2>
          <p className="text-[#6e6e73] text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 65) return APPLE_PALETTE.coral;
    if (score >= 45) return APPLE_PALETTE.peach;
    return APPLE_PALETTE.mint;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:space-y-4 print:text-black animate-fadeIn pb-16">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <Link href="/projects" className="inline-flex items-center space-x-2 text-xs font-semibold text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Directory</span>
        </Link>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] text-xs font-semibold rounded-full border border-black/10 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Audit Summary</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card (Apple Inset Surface) */}
      <div className="bg-white border border-black/5 rounded-3xl p-8 space-y-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[rgb(26,26,26)] bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/5">
                Work ID #{project.work_id}
              </span>
              <span 
                className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  backgroundColor: project.work_status?.toLowerCase().includes('completed') ? APPLE_PALETTE.mint : APPLE_PALETTE.blue,
                  color: '#1a1a1a'
                }}
              >
                {project.work_status || 'UNSPECIFIED'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[rgb(26,26,26)] tracking-tight leading-tight">
              {project.work_description || project.work || 'MPLADS Implementation Project'}
            </h1>
            <div className="text-xs text-[#6e6e73] flex flex-wrap items-center gap-3 pt-1">
              <span>Hon'ble MP: <strong className="text-[rgb(26,26,26)]">{project.mp_name || 'N/A'}</strong></span>
              <span>•</span>
              <span>State: <strong className="text-[rgb(26,26,26)]">{project.state || 'N/A'}</strong> ({project.constituency || 'N/A'})</span>
              <span>•</span>
              <span>Implementing Agency: <strong className="text-[rgb(26,26,26)]">{project.ida || 'N/A'}</strong></span>
            </div>
          </div>

          {/* Risk Score Pill */}
          {risk && (
            <div 
              className="p-5 rounded-2xl border border-black/5 text-center space-y-1 min-w-[160px] shadow-sm"
              style={{ backgroundColor: `${getRiskColor(risk.risk_score)}22` }}
            >
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6e6e73]">Risk Assessment</div>
              <div className="text-3xl font-bold font-mono text-[rgb(26,26,26)]">{risk.risk_score} / 100</div>
              <div 
                className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block"
                style={{ backgroundColor: getRiskColor(risk.risk_score), color: '#1a1a1a' }}
              >
                {risk.risk_level} RISK
              </div>
            </div>
          )}
        </div>

        {/* Financial Progress Cards (Pastel accents) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-black/5">
          <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5">
            <div className="text-[11px] text-[#6e6e73] uppercase tracking-wider font-semibold">Sanctioned Outlay</div>
            <div className="text-xl font-bold font-mono text-[rgb(26,26,26)] mt-1">{formatCurrency(project.sanction_amount)}</div>
          </div>
          <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5">
            <div className="text-[11px] text-[#6e6e73] uppercase tracking-wider font-semibold">Disbursed Funds</div>
            <div className="text-xl font-bold font-mono text-[rgb(26,26,26)] mt-1">{formatCurrency(project.total_expenditure)}</div>
            <div className="text-[10px] text-[#86868b] font-mono mt-0.5">{project.expenditure_vs_sanction_percent}% of sanction</div>
          </div>
          <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5">
            <div className="text-[11px] text-[#6e6e73] uppercase tracking-wider font-semibold">Unspent Balance</div>
            <div className="text-xl font-bold font-mono text-[rgb(26,26,26)] mt-1">{formatCurrency(project.remaining_sanction_amount)}</div>
          </div>
          <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5">
            <div className="text-[11px] text-[#6e6e73] uppercase tracking-wider font-semibold">Ledger Records</div>
            <div className="text-xl font-bold font-mono text-[rgb(26,26,26)] mt-1">{project.transaction_count} entries</div>
          </div>
        </div>
      </div>

      {/* Responsible AI Disclaimer Banner */}
      <div className="bg-[#f5f5f7] border border-black/5 rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#6e6e73]">
        <Info className="w-4 h-4 text-[rgb(26,26,26)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[rgb(26,26,26)]">Responsible AI Disclosure:</span> Risk scores and anomaly triggers highlight structural variances and financial patterns for authorized officer audit. These indicators do not constitute proof of irregularity.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk Factor Breakdown & Anomalies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Factors Breakdown */}
          {risk && risk.factor_scores && (
            <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#FFADAD]" />
                <span>Explainable Risk Factor Breakdown</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(risk.factor_scores).map(([factor, score], idx) => {
                  const barColor = getRiskColor(score);
                  return (
                    <div key={factor} className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#6e6e73] uppercase tracking-wider font-semibold">{factor.replace(/_/g, ' ')}</span>
                        <span className="text-[rgb(26,26,26)] font-mono font-bold">{score} / 100</span>
                      </div>
                      <div className="w-full bg-[#f0f0f2] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                      {risk.explanations && risk.explanations[factor] && (
                        <p className="text-[11px] text-[#6e6e73] pt-0.5 leading-normal">{risk.explanations[factor]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Signals & Anomalies */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#FFD6A5]" />
              <span>Independent AI Signals & Anomalies ({anomalies.length + (project.signals?.length || 0)})</span>
            </h3>

            {anomalies.length === 0 && (!project.signals || project.signals.length === 0) ? (
              <div className="p-8 text-center text-[#86868b] text-xs">
                No active anomaly triggers or variance signals recorded for this work.
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anom) => (
                  <div key={anom.anomaly_id} className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: anom.severity === 'CRITICAL' ? APPLE_PALETTE.coral : anom.severity === 'HIGH' ? APPLE_PALETTE.peach : APPLE_PALETTE.yellow,
                            color: '#1a1a1a'
                          }}
                        >
                          {anom.severity}
                        </span>
                        <span className="text-xs font-mono font-medium text-[rgb(26,26,26)]">{anom.anomaly_type}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[rgb(26,26,26)]">Score: {anom.score}</span>
                    </div>
                    <p className="text-xs text-[#6e6e73] leading-normal">{anom.reason}</p>
                    <div className="text-[11px] text-[#86868b] font-mono flex justify-between pt-1 border-t border-black/5">
                      <span>Detector: {anom.detector_name}</span>
                      <span>Confidence: {anom.confidence * 100}%</span>
                    </div>
                  </div>
                ))}

                {project.signals?.map((sig, idx) => (
                  <div key={idx} className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <span 
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: APPLE_PALETTE.peach, color: '#1a1a1a' }}
                      >
                        {sig.severity}
                      </span>
                      <span className="text-xs font-mono text-[#6e6e73]">{sig.signal_type}</span>
                    </div>
                    <p className="text-xs text-[#6e6e73] leading-normal">{sig.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Ledger Table */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#A0C4FF]" />
              <span>Expenditure Transaction Ledger ({project.transactions?.length || 0})</span>
            </h3>

            {!project.transactions || project.transactions.length === 0 ? (
              <div className="p-8 text-center text-[#86868b] text-xs">
                No expenditure transactions found for this work record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f5f5f7] text-[#6e6e73] font-mono uppercase tracking-wider border-b border-black/5">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Vendor / Agency</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Disbursed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-[#6e6e73]">
                    {project.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-[#fbfbfd]">
                        <td className="py-2.5 px-3 font-mono text-[#86868b]">{tx.expenditure_date || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-medium text-[rgb(26,26,26)]">{tx.vendor_name || 'Unspecified'}</td>
                        <td className="py-2.5 px-3">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
                          >
                            {tx.payment_status || 'Paid'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-[rgb(26,26,26)]">
                          {formatCurrency(tx.fund_disbursed_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Comparable Peer Projects */}
        <div className="space-y-6">
          {/* Project Lifecycle Timeline */}
          {history && (
            <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#BDB2FF]" />
                <span>Lifecycle History</span>
              </h3>
              <div className="space-y-4 border-l-2 border-black/10 ml-2 pl-4 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPLE_PALETTE.blue }} />
                  <div className="font-semibold text-[rgb(26,26,26)]">Recommended Date</div>
                  <div className="text-[#6e6e73]">{history.recommended_date || 'Not recorded'}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPLE_PALETTE.purple }} />
                  <div className="font-semibold text-[rgb(26,26,26)]">Sanction Date</div>
                  <div className="text-[#6e6e73]">{history.sanction_date || 'Not recorded'}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPLE_PALETTE.yellow }} />
                  <div className="font-semibold text-[rgb(26,26,26)]">First Expenditure</div>
                  <div className="text-[#6e6e73]">{history.first_expenditure_date || 'No transactions yet'}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPLE_PALETTE.mint }} />
                  <div className="font-semibold text-[rgb(26,26,26)]">Completion Record</div>
                  <div className="text-[#6e6e73]">{history.completion_date || 'Ongoing / Incomplete'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Comparable Peer Projects */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#FFC6FF]" />
              <span>Comparable Peer Projects</span>
            </h3>

            {comparables.length === 0 ? (
              <p className="text-xs text-[#86868b]">No comparable peer works found in same constituency.</p>
            ) : (
              <div className="space-y-3">
                {comparables.map((comp) => (
                  <Link
                    key={comp.work_id}
                    href={`/projects/${encodeURIComponent(comp.work_id)}`}
                    className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 hover:border-black/20 block transition-all space-y-1 shadow-xs"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-[rgb(26,26,26)] font-semibold">#{comp.work_id}</span>
                      <span className="font-mono text-[#6e6e73]">{formatCurrency(comp.sanction_amount)}</span>
                    </div>
                    <div className="text-xs text-[rgb(26,26,26)] font-medium truncate">{comp.mp_name}</div>
                    <div className="text-[10px] text-[#86868b]">{comp.similarity_context}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
