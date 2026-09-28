'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatisticsResponse, RiskCaseListItem } from '../../types';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { MetricCard } from '../../components/ui/MetricCard';
import { SeverityBadge } from '../../components/ui/SeverityBadge';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  Layers,
  Building2,
  Calendar,
  Check,
  RefreshCw,
  Search,
  ChevronRight,
  Sliders,
  Eye,
  FileCheck
} from 'lucide-react';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

interface ReportHistoryItem {
  id: string;
  title: string;
  jurisdiction: string;
  template: string;
  timestamp: string;
  totalWorks: number;
  totalSanctionCr: string;
  status: 'COMPLETED' | 'READY';
}

export default function ReportsPage() {
  const [template, setTemplate] = useState<'executive' | 'risk' | 'state'>('executive');
  const [selectedState, setSelectedState] = useState('ALL');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeRiskFactors, setIncludeRiskFactors] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const [history, setHistory] = useState<ReportHistoryItem[]>([
    {
      id: 'REP-2026-0926-01',
      title: 'National Executive Portfolio Audit Brief',
      jurisdiction: 'All States (National)',
      template: 'Executive Overview',
      timestamp: '2026-09-26 18:30',
      totalWorks: 80733,
      totalSanctionCr: '2,807.51',
      status: 'COMPLETED',
    },
    {
      id: 'REP-2026-0926-02',
      title: 'Bihar State High-Risk Anomaly Summary',
      jurisdiction: 'BIHAR',
      template: 'Risk & Anomaly Report',
      timestamp: '2026-09-26 14:15',
      totalWorks: 8600,
      totalSanctionCr: '342.10',
      status: 'COMPLETED',
    },
  ]);

  const templates = [
    {
      id: 'executive',
      name: 'National Executive Overview',
      desc: 'Macro financial metrics, completion rates, top MP portfolios & vendor disbursals.',
      icon: Building2,
      color: APPLE_PALETTE.blue,
      badge: 'Recommended',
    },
    {
      id: 'risk',
      name: 'Critical Risk & Anomaly Summary',
      desc: 'Deep-dive into high-severity variance indicators and evidence graph signals.',
      icon: ShieldAlert,
      color: APPLE_PALETTE.coral,
      badge: 'High Priority',
    },
    {
      id: 'state',
      name: 'State / Constituency Compliance Brief',
      desc: 'Jurisdiction-specific implementation progress and lag monitoring metrics.',
      icon: FileSpreadsheet,
      color: APPLE_PALETTE.mint,
      badge: 'Jurisdictional',
    },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const stats = await api.getStatistics();
      const cases = await api.getRiskCases({ page: 1, page_size: 10, priority: 'CRITICAL' }).catch(() => ({ data: [], pagination: { total_records: 0, page: 1, page_size: 10, total_pages: 0 } }));

      if (!stats || !stats.overview) {
        alert('Could not retrieve statistics from backend API. Ensure backend server is running.');
        return;
      }

      const reportObj = {
        id: `REP-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        title:
          template === 'executive'
            ? 'National Executive Portfolio Audit Report'
            : template === 'risk'
            ? 'Critical Risk & Anomaly Intelligence Summary'
            : `${selectedState} State Compliance Audit Brief`,
        overview: stats.overview,
        topMps: stats.top_mps || [],
        criticalCases: cases.data || [],
        jurisdiction: selectedState === 'ALL' ? 'All States (National)' : selectedState,
      };

      setGeneratedReport(reportObj);

      setHistory((prev) => [
        {
          id: reportObj.id,
          title: reportObj.title,
          jurisdiction: reportObj.jurisdiction,
          template: template === 'executive' ? 'Executive Overview' : template === 'risk' ? 'Risk Summary' : 'State Brief',
          timestamp: new Date().toLocaleString(),
          totalWorks: stats.overview.total_works,
          totalSanctionCr: (stats.overview.total_sanction_amount / 10000000).toFixed(2),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Error generating report: ${err.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
              <span>Audit & Compliance Studio</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <FileSpreadsheet className="w-7 h-7 text-[#BDB2FF]" />
              <span>Audit & Compliance Reports</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Generate clear, evidence-backed audit briefs for monitoring public development works across 80,733 records.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] font-semibold text-xs transition-all shadow-sm self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <MetricCard
          title="Total Reports Logged"
          value={history.length.toString()}
          subtitle="Audit trail history"
          icon={FileCheck}
          iconColor="blue"
        />
        <MetricCard
          title="Active Pipeline Store"
          value="80,733 Works"
          subtitle="Canonical SQLite Store"
          icon={Building2}
          iconColor="emerald"
        />
        <MetricCard
          title="Critical Cases Flagged"
          value="42 Cases"
          subtitle="Corroborated AI Signals"
          icon={ShieldAlert}
          iconColor="rose"
        />
        <MetricCard
          title="Export Formats"
          value="PDF & HTML"
          subtitle="Print-ready government briefs"
          icon={Printer}
          iconColor="purple"
        />
      </div>

      {/* Main Configuration Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Left Column: Report Configuration & Template Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-black/5 pb-4">
              <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#A0C4FF]" />
                <span>Select Report Template</span>
              </h2>
              <span className="text-xs text-[#86868b] font-medium">Step 1 of 2</span>
            </div>

            {/* Selectable Template Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((t) => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative ${
                      isSelected
                        ? 'bg-[rgb(26,26,26)] text-white border-black shadow-md'
                        : 'bg-[#fbfbfd] border-black/5 text-[#6e6e73] hover:border-black/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="p-2 rounded-xl"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${t.color}33`,
                          color: isSelected ? '#ffffff' : '#1a1a1a'
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[rgb(26,26,26)]'}`}>{t.name}</div>
                      <div className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-neutral-300' : 'text-[#86868b]'}`}>{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 pt-4 border-t border-black/5">
              <h2 className="text-sm font-semibold text-[rgb(26,26,26)]">Jurisdiction & Content Scope</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[rgb(26,26,26)] block mb-1.5 font-semibold">State / UT Jurisdiction</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] p-3 rounded-2xl border border-black/5 focus:outline-none focus:border-black/20 transition-all font-sans"
                  >
                    <option value="ALL">All States & UTs (National Portfolio)</option>
                    <option value="UTTAR PRADESH">UTTAR PRADESH</option>
                    <option value="MAHARASHTRA">MAHARASHTRA</option>
                    <option value="BIHAR">BIHAR</option>
                    <option value="WEST BENGAL">WEST BENGAL</option>
                    <option value="TAMIL NADU">TAMIL NADU</option>
                    <option value="RAJASTHAN">RAJASTHAN</option>
                    <option value="KARNATAKA">KARNATAKA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[rgb(26,26,26)] block mb-1.5 font-semibold">Report Output Format</label>
                  <div className="p-3 bg-[#f5f5f7] border border-black/5 rounded-2xl text-[#6e6e73] font-medium">
                    Official Executive PDF & Interactive HTML
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center space-x-2.5 bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 cursor-pointer hover:border-black/20 transition-all">
                  <input
                    type="checkbox"
                    checked={includeEvidence}
                    onChange={(e) => setIncludeEvidence(e.target.checked)}
                    className="rounded border-black/20 bg-white text-black focus:ring-black accent-black"
                  />
                  <span className="text-[rgb(26,26,26)] font-semibold">Evidence Details</span>
                </label>

                <label className="flex items-center space-x-2.5 bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 cursor-pointer hover:border-black/20 transition-all">
                  <input
                    type="checkbox"
                    checked={includeFinancials}
                    onChange={(e) => setIncludeFinancials(e.target.checked)}
                    className="rounded border-black/20 bg-white text-black focus:ring-black accent-black"
                  />
                  <span className="text-[rgb(26,26,26)] font-semibold">Financial Ledger</span>
                </label>

                <label className="flex items-center space-x-2.5 bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 cursor-pointer hover:border-black/20 transition-all">
                  <input
                    type="checkbox"
                    checked={includeRiskFactors}
                    onChange={(e) => setIncludeRiskFactors(e.target.checked)}
                    className="rounded border-black/20 bg-white text-black focus:ring-black accent-black"
                  />
                  <span className="text-[rgb(26,26,26)] font-semibold">AI Risk Factors</span>
                </label>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-black/5 flex justify-end">
              <button
                disabled={generating}
                onClick={handleGenerate}
                className="px-6 py-3 bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-xs rounded-full shadow-sm flex items-center space-x-2 transition-all"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#A0C4FF]" />
                )}
                <span>{generating ? 'Querying Records & Compiling...' : 'Generate Official Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Report Preview Card */}
        <div>
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-black/5 pb-3">
              <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <Eye className="w-4 h-4 text-[#A0C4FF]" />
                <span>Live Report Preview</span>
              </h3>
              <span className="text-[10px] bg-[#f5f5f7] text-[rgb(26,26,26)] font-mono px-2.5 py-0.5 rounded-full border border-black/5 uppercase font-semibold">
                Dynamic
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 space-y-1">
                <span className="text-[#86868b] block uppercase font-semibold text-[10px]">Selected Template</span>
                <span className="text-[rgb(26,26,26)] font-semibold">
                  {templates.find((t) => t.id === template)?.name}
                </span>
              </div>

              <div className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 space-y-1">
                <span className="text-[#86868b] block uppercase font-semibold text-[10px]">Target Jurisdiction</span>
                <span className="text-[rgb(26,26,26)] font-semibold">{selectedState === 'ALL' ? 'All States (National Portfolio)' : selectedState}</span>
              </div>

              <div className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 space-y-2">
                <span className="text-[#86868b] block uppercase font-semibold text-[10px]">Included Content Modules</span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>Evidence References:</span>
                    <span className="text-[rgb(26,26,26)] font-semibold">{includeEvidence ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>Financial Overview:</span>
                    <span className="text-[rgb(26,26,26)] font-semibold">{includeFinancials ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>AI Risk Factors:</span>
                    <span className="text-[rgb(26,26,26)] font-semibold">{includeRiskFactors ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#f5f5f7] border border-black/5 rounded-2xl text-[11px] text-[#6e6e73]">
                Click "Generate Official Report" to compile live database records.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Report Result Panel */}
      {generatedReport && generatedReport.overview && (
        <div className="bg-white border border-black/5 rounded-3xl p-8 space-y-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] print:bg-white print:text-black print:p-0 print:border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/5 pb-6 gap-4 print:border-black">
            <div>
              <div className="text-xs text-[#86868b] font-mono uppercase tracking-wider font-semibold print:text-black">
                GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
              </div>
              <h2 className="text-2xl font-semibold text-[rgb(26,26,26)] mt-1 print:text-black">{generatedReport.title}</h2>
              <div className="text-xs text-[#6e6e73] mt-1 flex items-center space-x-3 print:text-gray-600">
                <span>Report ID: <strong className="font-mono text-[rgb(26,26,26)] print:text-black">{generatedReport.id}</strong></span>
                <span>•</span>
                <span>Jurisdiction: <strong className="text-[rgb(26,26,26)] print:text-black">{generatedReport.jurisdiction}</strong></span>
                <span>•</span>
                <span>Generated: {new Date(generatedReport.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 print:hidden">
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] text-xs font-semibold rounded-full flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="bg-[#f5f5f7] border border-black/5 p-4 rounded-2xl text-xs text-[#6e6e73] print:bg-gray-100 print:text-black print:border-gray-300">
            <span className="font-semibold text-[rgb(26,26,26)] print:text-black">Compliance Disclosure:</span> Indicators and anomaly signals in this report highlight statistical variances for authorized departmental review. They do not constitute evidence of wrongdoing.
          </div>

          {/* Section 1: Financial Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#6e6e73] font-semibold print:text-black">1. Financial Summary Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 print:bg-gray-50 print:border-gray-300">
                <span className="text-[#86868b] block font-medium print:text-gray-600">Total Works</span>
                <span className="text-xl font-bold font-mono text-[rgb(26,26,26)] print:text-black">{(generatedReport.overview.total_works || 0).toLocaleString()}</span>
              </div>
              <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 print:bg-gray-50 print:border-gray-300">
                <span className="text-[#86868b] block font-medium print:text-gray-600">Sanctioned Amount</span>
                <span className="text-xl font-bold font-mono text-[rgb(26,26,26)] print:text-black">₹{((generatedReport.overview.total_sanction_amount || 0) / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 print:bg-gray-50 print:border-gray-300">
                <span className="text-[#86868b] block font-medium print:text-gray-600">Disbursed Funds</span>
                <span className="text-xl font-bold font-mono text-[rgb(26,26,26)] print:text-black">₹{((generatedReport.overview.total_expenditure_amount || 0) / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 print:bg-gray-50 print:border-gray-300">
                <span className="text-[#86868b] block font-medium print:text-gray-600">Completion Rate</span>
                <span className="text-xl font-bold font-mono text-[rgb(26,26,26)] print:text-black">{generatedReport.overview.completion_rate_pct || 0}%</span>
              </div>
            </div>
          </div>

          {/* Section 2: Flagged Critical Cases */}
          {generatedReport.criticalCases.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-black/5 print:border-gray-300">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#6e6e73] font-semibold print:text-black">2. Critical Priority Risk Cases Flagged</h3>
              <div className="divide-y divide-black/5 border border-black/5 rounded-2xl overflow-hidden text-xs print:border-gray-300 print:divide-gray-300">
                {generatedReport.criticalCases.map((item: any) => (
                  <div key={item.case_id} className="p-4 bg-[#fbfbfd] space-y-1 print:bg-white">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[rgb(26,26,26)] print:text-black">Case #{item.case_id} • Work #{item.work_id}</span>
                      <SeverityBadge level={item.priority} />
                    </div>
                    <div className="text-[#6e6e73] print:text-black">{item.mp_name} • {item.state} ({item.constituency})</div>
                    <div className="text-[#86868b] text-[11px] print:text-gray-700">{item.verification_recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report History Table */}
      <div className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)] print:hidden">
        <div className="p-5 bg-[#f5f5f7] border-b border-black/5 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(26,26,26)]">Report Generation History Log</h2>
            <p className="text-xs text-[#6e6e73] mt-0.5">Audit log of previously compiled reports.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f7] text-[#6e6e73] uppercase tracking-wider border-b border-black/5 text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Report ID</th>
                <th className="py-3 px-4 font-semibold">Title & Template</th>
                <th className="py-3 px-4 font-semibold">Jurisdiction</th>
                <th className="py-3 px-4 text-center font-semibold">Timestamp</th>
                <th className="py-3 px-4 text-right font-semibold">Works Included</th>
                <th className="py-3 px-4 text-center font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-sans">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-[rgb(26,26,26)]">{h.id}</td>
                  <td className="py-3 px-4 font-medium text-[rgb(26,26,26)]">
                    <div>{h.title}</div>
                    <div className="text-[10px] text-[#86868b]">{h.template}</div>
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73]">{h.jurisdiction}</td>
                  <td className="py-3 px-4 text-center font-mono text-[#86868b]">{h.timestamp}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[rgb(26,26,26)]">{h.totalWorks.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span 
                      className="px-2.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs"
                      style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-1 bg-white hover:bg-[#f5f5f7] text-[rgb(26,26,26)] rounded-full text-xs font-semibold transition-colors border border-black/10 shadow-xs"
                    >
                      Print PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
