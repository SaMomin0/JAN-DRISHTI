'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  ShieldAlert, 
  ArrowUpRight,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  FileCheck2,
  AlertTriangle,
  Compass,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { StatisticsResponse, RiskDistributionResponse, RiskFactorSummaryResponse } from '../../types';
import { MOCK_ANALYTICS } from '../../lib/mockData';
import { MetricCard } from '../../components/ui/MetricCard';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import {
  AppleDonutChart,
  ApplePieChart,
  ApplePolarAreaChart,
  AppleSemiCircleGauge,
  AppleActivityRings,
  AppleBarChart,
  AppleStackedBarChart,
  AppleAreaSplineChart,
  AppleMultivariateScatterChart,
  APPLE_PALETTE,
  PASTEL_ARRAY
} from '../../components/charts/AppleCharts';

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<'ALL' | 'FY24' | 'FY23'>('ALL');
  const [chartView, setChartView] = useState<'spline' | 'bars'>('spline');
  const [pieMode, setPieMode] = useState<'donut' | 'sliced' | 'polar'>('donut');
  const [sortField, setSortField] = useState<'avg_risk' | 'works' | 'total_amt'>('avg_risk');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [riskDist, setRiskDist] = useState<RiskDistributionResponse | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactorSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [s, r, f] = await Promise.all([
          api.getStatistics(),
          api.getRiskDistribution(),
          api.getRiskFactors(),
        ]);
        if (s) setStats(s);
        if (r) setRiskDist(r);
        if (f) setRiskFactors(f);
      } catch (err) {
        console.error('Error fetching analytics live data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sortedStates = [...MOCK_ANALYTICS.state_risk_league].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: 'avg_risk' | 'works' | 'total_amt') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Sector distribution transformed for Donut
  const sectorDonutData = MOCK_ANALYTICS.category_distribution.map((cat, idx) => ({
    label: cat.name,
    value: cat.value,
    sublabel: `${cat.count.toLocaleString()} works`,
    color: PASTEL_ARRAY[idx % PASTEL_ARRAY.length],
  }));

  // Velocity data for Spline Area Chart
  const velocitySplineSeries = [
    {
      name: 'Sanction Pool',
      color: APPLE_PALETTE.blue,
      values: MOCK_ANALYTICS.quarterly_velocity.map(q => q.sanctions),
    },
    {
      name: 'Disbursed Funds',
      color: APPLE_PALETTE.mint,
      values: MOCK_ANALYTICS.quarterly_velocity.map(q => q.expenditure),
    },
    {
      name: 'Risk Exposure',
      color: APPLE_PALETTE.coral,
      values: MOCK_ANALYTICS.quarterly_velocity.map(q => q.flagged * 3.5),
    },
  ];

  // Bar chart items
  const velocityBarData = MOCK_ANALYTICS.quarterly_velocity.map((q, idx) => ({
    label: q.quarter,
    value: q.sanctions,
    secondaryValue: q.expenditure,
    color: APPLE_PALETTE.blue,
    secondaryColor: APPLE_PALETTE.mint,
  }));

  // Sliced Pie Chart Data for Anomaly Types
  const anomalyPieData = [
    { label: 'Spatial-Geotag Outlier', value: 34, color: APPLE_PALETTE.coral },
    { label: 'Expenditure Velocity Spike', value: 24, color: APPLE_PALETTE.peach },
    { label: 'Collusion & Tender Clustering', value: 18, color: APPLE_PALETTE.yellow },
    { label: 'Milestone Discrepancy', value: 14, color: APPLE_PALETTE.purple },
    { label: 'Ghost Contractor Footprint', value: 10, color: APPLE_PALETTE.pink },
  ];

  // Concentric Rings data for Verification & Integrity
  const integrityRings = [
    { label: 'Satellite Verification', current: 78, target: 100, color: APPLE_PALETTE.sky },
    { label: 'Financial Reconciliation', current: 86, target: 100, color: APPLE_PALETTE.mint },
    { label: 'Ground Audit Clearance', current: 62, target: 100, color: APPLE_PALETTE.purple },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1500px] mx-auto pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#A0C4FF]/20 via-[#FFC6FF]/15 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
              <span>Apple HIG Visual Intelligence Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[rgb(26,26,26)] tracking-tight">
              Multivariate Portfolio Analytics
            </h1>
            <p className="text-sm text-[#6e6e73] font-normal leading-relaxed">
              Real-time systemic anomaly detection, quarterly velocity splines, multi-format pie charts, and jurisdictional risk rankings across 80,733 records.
            </p>
          </div>

          {/* Apple Segmented Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="apple-segmented-container">
              <button
                onClick={() => setTimePeriod('ALL')}
                className={`apple-segmented-item ${timePeriod === 'ALL' ? 'active' : ''}`}
              >
                All-Time (80.7k)
              </button>
              <button
                onClick={() => setTimePeriod('FY24')}
                className={`apple-segmented-item ${timePeriod === 'FY24' ? 'active' : ''}`}
              >
                FY 2024-25
              </button>
              <button
                onClick={() => setTimePeriod('FY23')}
                className={`apple-segmented-item ${timePeriod === 'FY23' ? 'active' : ''}`}
              >
                FY 2023-24
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-full border border-black/10 bg-white hover:bg-[#f5f5f7] text-xs font-semibold text-[rgb(26,26,26)] flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Highlights Grid (Apple HIG Metric Cards with Pastel Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Sanctioned Pool"
          value={stats?.overview?.total_sanction_amount ? `₹${(stats.overview.total_sanction_amount / 10000000).toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr` : "₹4,259.4 Cr"}
          subtitle={`${stats?.overview?.total_works ? stats.overview.total_works.toLocaleString() : '80,733'} Project Allocations`}
          icon={BarChart3}
          iconColor="blue"
          trend={{ value: "543 Constituencies", positive: true }}
          progressPct={100}
        />
        <MetricCard
          title="Disbursed Funds"
          value={stats?.overview?.total_expenditure_amount ? `₹${(stats.overview.total_expenditure_amount / 10000000).toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr` : "₹2,821.7 Cr"}
          subtitle={`${stats?.overview?.national_expenditure_rate_pct || 33.8}% Utilization Rate`}
          icon={TrendingUp}
          iconColor="emerald"
          trend={{ value: `${stats?.overview?.national_expenditure_rate_pct || 33.8}% Utilized`, positive: true }}
          progressPct={stats?.overview?.national_expenditure_rate_pct || 33.8}
        />
        <MetricCard
          title="High Risk Outliers"
          value={riskDist?.distribution?.HIGH ? `${riskDist.distribution.HIGH.toLocaleString()} Works` : "169 Works"}
          subtitle={`${riskDist?.distribution?.MEDIUM ? riskDist.distribution.MEDIUM.toLocaleString() : '17,900'} Medium Risk`}
          icon={ShieldAlert}
          iconColor="rose"
          trend={{ value: `${riskDist?.percentages?.HIGH || 0.21}% Outlier Rate`, positive: false }}
          progressPct={riskDist?.percentages?.HIGH || 0.21}
        />
        <MetricCard
          title="Completed Schemes"
          value={stats?.overview?.completed_works_count ? `${stats.overview.completed_works_count.toLocaleString()} Works` : "35,292 Works"}
          subtitle={`${stats?.overview?.completion_rate_pct || 43.7}% Completion Rate`}
          icon={FileCheck2}
          iconColor="purple"
          trend={{ value: `${stats?.overview?.completion_rate_pct || 43.7}% Resolution`, positive: true }}
          progressPct={stats?.overview?.completion_rate_pct || 43.7}
        />
      </div>

      {/* Primary Visualizations: Velocity Chart & Multi-Format Chart Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Velocity Curve (Spline Area / Grouped Bar) */}
        <div className="lg:col-span-7 rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#A0C4FF]" />
                <span>Quarterly Fund Disbursal Velocity & Trajectory</span>
              </h2>
              <p className="text-xs text-[#6e6e73] mt-0.5">
                Comparison of sanctions (₹k Cr), realized disbursements, and risk triggers over 7 fiscal quarters.
              </p>
            </div>

            {/* Chart Type Toggle */}
            <div className="apple-segmented-container">
              <button
                onClick={() => setChartView('spline')}
                className={`apple-segmented-item ${chartView === 'spline' ? 'active' : ''}`}
              >
                Spline Area
              </button>
              <button
                onClick={() => setChartView('bars')}
                className={`apple-segmented-item ${chartView === 'bars' ? 'active' : ''}`}
              >
                Grouped Bars
              </button>
            </div>
          </div>

          {/* Interactive Chart Component */}
          <div className="pt-2">
            {chartView === 'spline' ? (
              <AppleAreaSplineChart
                categories={MOCK_ANALYTICS.quarterly_velocity.map(q => q.quarter)}
                series={velocitySplineSeries}
                height={260}
                yAxisLabel="₹k Cr"
              />
            ) : (
              <div className="space-y-4">
                <AppleBarChart
                  data={velocityBarData}
                  height={220}
                  showSecondaryLegend
                  secondaryLegendText="Disbursal"
                />
                <div className="flex items-center justify-center gap-6 text-xs text-[#6e6e73]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: APPLE_PALETTE.blue }} />
                    Sanctioned Pool (₹k Cr)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: APPLE_PALETTE.mint }} />
                    Realized Disbursal (₹k Cr)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6e6e73]">
            <span>Peak sanction cycle: <strong>Q3 FY24 (₹31.4k Cr)</strong></span>
            <span className="font-mono text-[11px] text-[rgb(26,26,26)] font-medium">
              Correlation with disbursement: <strong>+0.92 (High)</strong>
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Sector Allocation Pie Charts (3 Styles: Donut, Polar Area, Sliced) */}
        <div className="lg:col-span-5 rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#FFD6A5]" />
                <span>Sectoral Allocation</span>
              </h2>
              <p className="text-xs text-[#6e6e73] mt-0.5">
                3 Apple HIG Pie Chart varieties.
              </p>
            </div>

            <div className="apple-segmented-container">
              <button
                onClick={() => setPieMode('donut')}
                className={`apple-segmented-item ${pieMode === 'donut' ? 'active' : ''}`}
              >
                Donut
              </button>
              <button
                onClick={() => setPieMode('polar')}
                className={`apple-segmented-item ${pieMode === 'polar' ? 'active' : ''}`}
              >
                Polar
              </button>
              <button
                onClick={() => setPieMode('sliced')}
                className={`apple-segmented-item ${pieMode === 'sliced' ? 'active' : ''}`}
              >
                Sliced
              </button>
            </div>
          </div>

          <div className="py-2">
            {pieMode === 'donut' && (
              <AppleDonutChart
                data={sectorDonutData}
                size={210}
                thickness={32}
                centerTitle="80.7k"
                centerSubtitle="Total Works"
              />
            )}
            {pieMode === 'polar' && (
              <ApplePolarAreaChart
                data={sectorDonutData}
                size={210}
              />
            )}
            {pieMode === 'sliced' && (
              <ApplePieChart
                data={sectorDonutData}
                size={200}
              />
            )}
          </div>

          <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-[#6e6e73]">
            <span>Water Conservation dominates 42%</span>
            <Link href="/projects" className="text-[rgb(26,26,26)] font-semibold hover:underline inline-flex items-center gap-1">
              <span>View Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Second Row of Charts: Pie Chart & Apple HIG Activity Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): Classic Sliced Pie Chart for Anomaly Taxonomies */}
        <div className="lg:col-span-6 rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/5 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FFADAD]" />
                <span>Anomaly Signal Taxonomy (Sliced Pie Chart)</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFADAD]/20 text-[#1a1a1a] text-[11px] font-mono font-medium">
                3,418 Signals
              </span>
            </div>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              High-confidence machine learning trigger breakdown across forensic models.
            </p>
          </div>

          <div className="py-2">
            <ApplePieChart
              data={anomalyPieData}
              size={210}
            />
          </div>

          <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-[#6e6e73]">
            <span>Primary driver: Satellite geotag variance (34%)</span>
            <Link href="/risk" className="text-[rgb(26,26,26)] font-semibold hover:underline inline-flex items-center gap-1">
              <span>Investigate Flags</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (6 cols): Concentric Apple Activity Rings & Composite Speedometer Gauge */}
        <div className="lg:col-span-6 rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/5 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#BDB2FF]" />
                <span>Verification Pipeline & Integrity Gauge</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#CAFFBF]/40 text-[#1a1a1a] text-[11px] font-mono font-medium">
                73.4 Composite
              </span>
            </div>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              Concentric Apple Activity Rings with semi-circular speedometer gauge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
            {/* Concentric Progress Rings */}
            <div className="flex flex-col items-center">
              <AppleActivityRings
                rings={integrityRings}
                size={170}
                strokeWidth={14}
              />
            </div>

            {/* Speedometer Gauge */}
            <div className="flex flex-col items-center">
              <AppleSemiCircleGauge
                value={73.4}
                max={100}
                label="Portfolio Health Index"
                sublabel="Within safe variance envelope"
                color={APPLE_PALETTE.mint}
                size={190}
              />
            </div>
          </div>

          {/* Stacked Composition Bar */}
          <div className="pt-2 border-t border-black/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[rgb(26,26,26)]">Audited Dossier Resolution Breakdown</span>
              <span className="font-mono text-[#6e6e73]">1,940 works</span>
            </div>
            <AppleStackedBarChart
              segments={[
                { label: 'Cleared', value: 1100, color: APPLE_PALETTE.mint },
                { label: 'Action Taken', value: 540, color: APPLE_PALETTE.peach },
                { label: 'Escalated to Vigilance', value: 300, color: APPLE_PALETTE.coral },
              ]}
              height={14}
            />
          </div>
        </div>
      </div>

      {/* Multivariate Scatter & Bubble Analysis Section */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#A0C4FF]/25 text-[10px] font-mono font-bold text-[rgb(26,26,26)] uppercase">
              Multivariate 3D Space
            </div>
            <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2 mt-1">
              <Activity className="w-5 h-5 text-[#A0C4FF]" />
              <span>Multivariate Scatter Plot: Outlay × Anomaly Severity × Portfolio Volume</span>
            </h2>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              X-axis: Sanction Allocation (₹ Cr) • Y-axis: Anomaly Severity Index (0-100) • Radius: Monitored Work Volume.
            </p>
          </div>
          <Link
            href="/multivariate"
            className="px-4 py-2 rounded-full border border-black/10 bg-white hover:bg-[#f5f5f7] text-xs font-semibold text-[rgb(26,26,26)] flex items-center gap-2 shadow-xs transition-all"
          >
            <span>Full Multivariate Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="py-2">
          <AppleMultivariateScatterChart
            points={MOCK_ANALYTICS.state_risk_league.map((st, idx) => ({
              label: st.state,
              x: st.total_amt,
              y: st.avg_risk,
              sizeVal: st.works,
              color: PASTEL_ARRAY[idx % PASTEL_ARRAY.length],
            }))}
            xLabel="State Sanction Allocation Pool (₹ Cr)"
            yLabel="Composite Risk Severity (0-100)"
            height={240}
          />
        </div>
      </div>

      {/* State Risk League Benchmark Table (Apple HIG Inset Grouped Table) */}
      <div className="rounded-3xl border border-black/5 bg-white backdrop-blur-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FFADAD]" />
              <span>State & UT Risk Vulnerability League</span>
            </h2>
            <p className="text-xs text-[#6e6e73]">
              Comparative ranking of State implementation risk envelopes and critical trigger volume.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#6e6e73]">Sort by:</span>
            <div className="apple-segmented-container">
              <button
                onClick={() => handleSort('avg_risk')}
                className={`apple-segmented-item ${sortField === 'avg_risk' ? 'active' : ''}`}
              >
                Avg Risk {sortField === 'avg_risk' && (sortAsc ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('works')}
                className={`apple-segmented-item ${sortField === 'works' ? 'active' : ''}`}
              >
                Works {sortField === 'works' && (sortAsc ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('total_amt')}
                className={`apple-segmented-item ${sortField === 'total_amt' ? 'active' : ''}`}
              >
                Amount {sortField === 'total_amt' && (sortAsc ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f7] text-[#6e6e73] uppercase tracking-wider font-mono text-[10px] border-b border-black/5">
              <tr>
                <th className="py-3.5 px-6 font-semibold">Rank & State</th>
                <th className="py-3.5 px-6 text-right font-semibold cursor-pointer" onClick={() => handleSort('works')}>
                  Works Monitored
                </th>
                <th className="py-3.5 px-6 text-right font-semibold cursor-pointer" onClick={() => handleSort('total_amt')}>
                  Total Allocation (₹ Cr)
                </th>
                <th className="py-3.5 px-6 font-semibold">Risk Score Benchmark</th>
                <th className="py-3.5 px-6 text-right font-semibold">High Risk Cases</th>
                <th className="py-3.5 px-6 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-sans">
              {sortedStates.map((st, idx) => {
                const isHighRisk = st.avg_risk >= 65;
                const isMedRisk = st.avg_risk >= 45 && st.avg_risk < 65;
                const riskColor = isHighRisk ? APPLE_PALETTE.coral : isMedRisk ? APPLE_PALETTE.peach : APPLE_PALETTE.mint;

                return (
                  <tr key={st.state} className="hover:bg-[#fbfbfd] transition-colors">
                    <td className="py-4 px-6 font-medium text-[rgb(26,26,26)] flex items-center gap-3">
                      <span className="font-mono text-xs text-[#86868b] w-5">#{idx + 1}</span>
                      <span className="text-sm font-semibold">{st.state}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[#6e6e73]">
                      {st.works.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[rgb(26,26,26)] font-semibold">
                      ₹{st.total_amt.toLocaleString()} Cr
                    </td>
                    <td className="py-4 px-6 min-w-[200px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span 
                            className="font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${riskColor}33`, color: 'rgb(26,26,26)' }}
                          >
                            {st.avg_risk}/100
                          </span>
                          <span className="text-[#6e6e73]">
                            {isHighRisk ? 'Vulnerable' : isMedRisk ? 'Moderate' : 'Stable'}
                          </span>
                        </div>
                        <div className="w-full bg-[#f0f0f2] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${st.avg_risk}%`, backgroundColor: riskColor }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-semibold text-[rgb(26,26,26)]">
                      <span className="px-2.5 py-1 rounded-full bg-[#FFADAD]/25 text-[#1a1a1a] text-xs font-semibold">
                        {st.high_risk} cases
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        href={`/projects?state=${encodeURIComponent(st.state.toUpperCase())}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/10 text-[rgb(26,26,26)] font-medium text-[11px] shadow-sm transition-all"
                      >
                        <span>Filter Works</span>
                        <ArrowRight className="w-3 h-3 text-[#A0C4FF]" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
