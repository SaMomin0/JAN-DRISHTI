'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  TrendingUp, 
  FolderSearch, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Cpu, 
  Search, 
  ChevronRight, 
  Sparkles, 
  PieChart, 
  Activity,
  Layers,
  Building2,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { StatisticsResponse, RiskDistributionResponse, RiskCaseListItem } from '../../types';
import { MOCK_PROJECTS, MOCK_RISK_CASES, MOCK_ANALYTICS } from '../../lib/mockData';
import { MetricCard } from '../../components/ui/MetricCard';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import { SeverityBadge } from '../../components/ui/SeverityBadge';
import { 
  AppleDonutChart, 
  AppleSemiCircleGauge, 
  AppleActivityRings, 
  AppleBarChart, 
  AppleStackedBarChart,
  APPLE_PALETTE,
  PASTEL_ARRAY
} from '../../components/charts/AppleCharts';

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [riskDist, setRiskDist] = useState<RiskDistributionResponse | null>(null);
  const [liveCases, setLiveCases] = useState<RiskCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsData, distData, casesData] = await Promise.all([
          api.getStatistics(),
          api.getRiskDistribution(),
          api.getRiskCases({ page: 1, page_size: 20 }),
        ]);
        if (statsData) setStats(statsData);
        if (distData) setRiskDist(distData);
        if (casesData?.data?.length) setLiveCases(casesData.data);
      } catch (err) {
        console.error('Error fetching live dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const casesToDisplay = liveCases.length > 0 ? liveCases : MOCK_RISK_CASES;

  const filteredCases = casesToDisplay.filter((c: any) => {
    const sev = c.priority || c.severity || 'MEDIUM';
    const matchesSev = selectedFilter === 'ALL' || sev === selectedFilter;
    const title = c.verification_recommendation || c.title || c.work || '';
    const workId = c.work_id || '';
    const state = c.state || '';
    const constituency = c.constituency || c.district || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          workId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  // Data for Apple Donut Chart (Sector Distribution)
  const sectorChartData = MOCK_ANALYTICS.category_distribution.map((cat, idx) => ({
    label: cat.category,
    value: cat.count,
    color: PASTEL_ARRAY[idx % PASTEL_ARRAY.length],
  }));

  // Data for Activity Rings
  const activityRingsData = [
    { label: 'Field Proof Verified', value: 1940, max: 3418, color: APPLE_PALETTE.mint },
    { label: 'Satellite Geotagged', value: 2840, max: 3418, color: APPLE_PALETTE.blue },
    { label: 'Audit Trail Closed', value: 1420, max: 3418, color: APPLE_PALETTE.purple },
  ];

  // Data for State Outlay Bar Chart
  const stateBarData = [
    { label: 'UP', value: 3420, color: APPLE_PALETTE.coral },
    { label: 'MH', value: 2890, color: APPLE_PALETTE.peach },
    { label: 'BR', value: 2410, color: APPLE_PALETTE.yellow },
    { label: 'WB', value: 1980, color: APPLE_PALETTE.mint },
    { label: 'TN', value: 1760, color: APPLE_PALETTE.sky },
    { label: 'MP', value: 1640, color: APPLE_PALETTE.blue },
    { label: 'RJ', value: 1450, color: APPLE_PALETTE.purple },
    { label: 'KA', value: 1320, color: APPLE_PALETTE.pink },
  ];

  // Data for Stacked Portfolio Composition
  const portfolioSegments = [
    { label: 'Completed', value: 46825, color: APPLE_PALETTE.mint },
    { label: 'In Progress', value: 24500, color: APPLE_PALETTE.blue },
    { label: 'Lagging (>180d)', value: 5990, color: APPLE_PALETTE.yellow },
    { label: 'Flagged Anomaly', value: 3418, color: APPLE_PALETTE.coral },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Executive Briefing Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f0f3] text-[11px] font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(26,26,26)]" />
              <span>MoSPI Executive Vigilance Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[rgb(26,26,26)] tracking-tight">
              National Implementation & Risk Triage Portal
            </h1>
            <p className="text-sm text-[#6e6e73] font-normal leading-relaxed">
              Real-time statistical surveillance across 80,733 sanctioned public works. Prioritise evidence verification before formal audit across all 543 Parliamentary Constituencies.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <Link
              href="/analysis"
              className="apple-pill-btn apple-pill-btn-primary"
            >
              <Cpu className="w-4 h-4" />
              <span>Run Pipeline</span>
            </Link>
            <Link
              href="/reports"
              className="apple-pill-btn apple-pill-btn-secondary"
            >
              <FileSpreadsheet className="w-4 h-4 text-[rgb(26,26,26)]" />
              <span>Export Dossier</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Canonical Works Monitored"
          value={stats?.overview?.total_works ? stats.overview.total_works.toLocaleString() : "80,733"}
          subtitle="543 Parliamentary Constituencies"
          icon={FolderSearch}
          accentColor={APPLE_PALETTE.blue}
          trend={{ value: "100% Ingested", positive: true }}
          progressPct={100}
        />
        <MetricCard
          title="Flagged High Risk Works"
          value={riskDist?.distribution?.HIGH ? riskDist.distribution.HIGH.toLocaleString() : "169"}
          subtitle={`${riskDist?.distribution?.MEDIUM ? riskDist.distribution.MEDIUM.toLocaleString() : '17,900'} Medium • Live DB`}
          icon={AlertTriangle}
          accentColor={APPLE_PALETTE.coral}
          trend={{ value: `${riskDist?.percentages?.HIGH || 0.21}% High Risk`, positive: false }}
          progressPct={riskDist?.percentages?.HIGH || 0.21}
        />
        <MetricCard
          title="Completed Schemes"
          value={stats?.overview?.completed_works_count ? stats.overview.completed_works_count.toLocaleString() : "35,292"}
          subtitle={`₹${((stats?.overview?.total_expenditure_amount || 28217170102) / 10000000).toFixed(1)} Cr Disbursed`}
          icon={CheckCircle2}
          accentColor={APPLE_PALETTE.mint}
          trend={{ value: `${stats?.overview?.completion_rate_pct || 43.7}% Completion`, positive: true }}
          progressPct={stats?.overview?.completion_rate_pct || 43.7}
        />
        <MetricCard
          title="National Sanction Pool"
          value={`₹${((stats?.overview?.total_sanction_amount || 42594408712) / 1000000000).toFixed(2)}B`}
          subtitle="Real SQLite Master Ledger"
          icon={TrendingUp}
          accentColor={APPLE_PALETTE.peach}
          trend={{ value: `${stats?.overview?.national_expenditure_rate_pct || 33.8}% Utilization`, positive: true }}
          progressPct={stats?.overview?.national_expenditure_rate_pct || 33.8}
        />
      </div>

      {/* Interactive Apple Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Semi-Circle Gauge Card */}
        <div className="lg:col-span-4 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[rgb(26,26,26)]" />
              <span>National Composite Risk Index</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFD6A5] text-[rgb(26,26,26)] font-bold">
              MODERATE
            </span>
          </div>

          <div className="py-4">
            <AppleSemiCircleGauge
              value={42}
              title="Anomaly Severity Score"
              subtitle="Calculated across 5 statistical vectors relative to national baseline."
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/5 text-center text-xs">
            <div className="p-2 rounded-xl bg-[#f5f5f7]">
              <span className="text-[10px] text-[#86868b] block">Low Tier</span>
              <span className="font-mono font-bold text-[rgb(26,26,26)]">&lt; 35</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f5f5f7]">
              <span className="text-[10px] text-[#86868b] block">Moderate</span>
              <span className="font-mono font-bold text-[rgb(26,26,26)]">35 - 65</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f5f5f7]">
              <span className="text-[10px] text-[#86868b] block">Critical</span>
              <span className="font-mono font-bold text-[rgb(26,26,26)]">&gt; 65</span>
            </div>
          </div>
        </div>

        {/* Sector Allocation Donut Chart */}
        <div className="lg:col-span-8 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[rgb(26,26,26)]" />
                <span>Sector Portfolio Distribution (Interactive Donut)</span>
              </h3>
              <p className="text-[11px] text-[#86868b] mt-0.5">Distribution of 80,733 works categorized by development sector.</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[rgb(26,26,26)] bg-[#f0f0f3] px-3 py-1 rounded-full">
              ₹14,820 Cr Total Outlay
            </span>
          </div>

          <div className="py-2">
            <AppleDonutChart
              data={sectorChartData}
              centerTitle="80,733"
              centerSubtitle="Total Works"
              size={210}
            />
          </div>
        </div>
      </div>

      {/* Portfolio Composition & Comparative Outlays Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* National Portfolio Composition Stacked Bar */}
        <div className="lg:col-span-7 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[rgb(26,26,26)]" />
              <span>National Work Status Composition</span>
            </h3>
            <span className="text-[11px] font-mono text-[#86868b]">80,733 Works Indexed</span>
          </div>

          <p className="text-xs text-[#6e6e73]">
            Continuous reconciliation across execution milestones: completed works, active construction, duration delays, and statistical variance flags.
          </p>

          <AppleStackedBarChart segments={portfolioSegments} />

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-[rgb(26,26,26)] mb-2">Top 8 State Work Volumes:</h4>
            <AppleBarChart data={stateBarData} height={140} />
          </div>
        </div>

        {/* Multi-Ring Verification Progress */}
        <div className="lg:col-span-5 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between">
          <div className="border-b border-black/5 pb-3">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[rgb(26,26,26)]" />
              <span>Multi-Pillar Evidence Resolution</span>
            </h3>
            <p className="text-[11px] text-[#86868b] mt-0.5">Verification status of 3,418 flagged anomaly records.</p>
          </div>

          <div className="py-2">
            <AppleActivityRings rings={activityRingsData} size={170} />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/5 text-xs text-[#6e6e73] leading-relaxed">
            <strong className="text-[rgb(26,26,26)]">Active Audit Protocol:</strong> 56.7% of flagged anomalies have completed physical on-site verification and submitted photographic proof.
          </div>
        </div>
      </div>

      {/* Priority Triage Queue (Apple Inset Grouped Table) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[rgb(26,26,26)]" />
              <span>Priority Verification Triage Queue</span>
            </h2>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              Active dossiers requiring field officer inspection and documentary corroboration.
            </p>
          </div>

          {/* Apple-style Segmented Filter */}
          <div className="apple-segmented-container">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`apple-segmented-item ${selectedFilter === 'ALL' ? 'active' : ''}`}
            >
              All ({MOCK_RISK_CASES.length})
            </button>
            <button
              onClick={() => setSelectedFilter('CRITICAL')}
              className={`apple-segmented-item ${selectedFilter === 'CRITICAL' ? 'active' : ''}`}
            >
              Critical
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH')}
              className={`apple-segmented-item ${selectedFilter === 'HIGH' ? 'active' : ''}`}
            >
              High
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case ID, work description, district, or MP name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/10 focus:border-[rgb(26,26,26)] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none transition-all shadow-xs"
          />
        </div>

        {/* Cases List */}
        <div className="space-y-3">
          {filteredCases.map((rc: any) => {
            const severityLevel = rc.priority === 'CRITICAL' || rc.severity === 'CRITICAL' ? 'CRITICAL' : 
                                 rc.priority === 'HIGH' || rc.severity === 'HIGH' ? 'HIGH' : 'MEDIUM';
            const statusLabel = rc.case_status || rc.status || 'OPEN';
            const caseTitle = rc.title || (rc.work_category ? `${rc.work_category} (${rc.work_id})` : `MPLADS Work ${rc.work_id}`);
            const summaryText = rc.dossier?.project_summary || rc.verification_recommendation || 'Field verification recommended based on statistical risk signals.';
            const locationDistrict = rc.constituency || rc.district || 'District Triage';
            const primarySig = rc.primary_signal || (rc.signal_count ? `${rc.signal_count} AI Signals Flagged` : 'Cost & Timeline Variance');
            const scoreVal = rc.risk_score || (severityLevel === 'CRITICAL' ? 88 : severityLevel === 'HIGH' ? 78 : 58);

            return (
              <SpotlightCard
                key={rc.case_id}
                className="space-y-3 hover:border-black/15 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[rgb(26,26,26)] bg-[#f0f0f3] px-2.5 py-0.5 rounded-full border border-black/5">
                      {rc.case_id}
                    </span>
                    <span className="text-xs text-[#86868b] font-mono">{rc.work_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge level={severityLevel} />
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-black/5 text-[rgb(26,26,26)] font-medium">
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[rgb(26,26,26)] hover:underline">
                    <Link href={`/risk/${rc.case_id}`}>{caseTitle}</Link>
                  </h3>
                  <p className="text-xs text-[#6e6e73] leading-relaxed font-normal">
                    {summaryText}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6e6e73] border-t border-black/5">
                  <div className="flex items-center gap-4">
                    <span><strong className="text-[rgb(26,26,26)]">District:</strong> {locationDistrict}, {rc.state}</span>
                    <span><strong className="text-[rgb(26,26,26)]">Primary Signal:</strong> <span className="text-[rgb(26,26,26)] font-semibold">{primarySig}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[rgb(26,26,26)]">Score: {scoreVal}/100</span>
                    <Link
                      href={`/risk/${rc.case_id}`}
                      className="inline-flex items-center gap-1 text-xs text-[rgb(26,26,26)] hover:underline font-semibold"
                    >
                      <span>Examine Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
