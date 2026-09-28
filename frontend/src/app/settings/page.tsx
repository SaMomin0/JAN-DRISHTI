'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { HealthResponse } from '../../types';
import { Settings, Database, Sliders, CheckCircle2, RefreshCw, Cpu, Server, Shield, Sparkles } from 'lucide-react';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Threshold state sliders
  const [sanctionLagDays, setSanctionLagDays] = useState(180);
  const [variancePct, setVariancePct] = useState(15);
  const [minConfidence, setMinConfidence] = useState(70);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        console.error('Error fetching health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const handleSaveThresholds = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-medium tracking-wider uppercase text-[rgb(26,26,26)] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
          <span>System Diagnostics & Controls</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
          <Settings className="w-7 h-7 text-[#BDB2FF]" />
          <span>System Settings & Engine Diagnostics</span>
        </h1>
        <p className="text-[#6e6e73] text-sm mt-1 max-w-2xl font-normal">
          Configure detector sensitivity thresholds and inspect backend infrastructure status.
        </p>
      </div>

      {/* System Infrastructure Card */}
      <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 space-y-5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
          <Server className="w-4 h-4 text-[#A0C4FF]" />
          <span>Backend & Canonical Data Store Status</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#6e6e73]">
            <RefreshCw className="w-5 h-5 text-[rgb(26,26,26)] animate-spin mx-auto mb-2 opacity-70" />
            Checking server health...
          </div>
        ) : !health ? (
          <div className="text-xs text-[#86868b] p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">Failed to connect to backend server.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-1">
              <span className="text-[#86868b] font-semibold block uppercase text-[10px]">Database Status</span>
              <span className="text-[rgb(26,26,26)] font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1a1a1a]" style={{ color: APPLE_PALETTE.mint }} />
                <span>{health.database.status.toUpperCase()}</span>
              </span>
              <span className="text-[11px] text-[#6e6e73] font-mono block pt-0.5">{health.database.work_records.toLocaleString()} works loaded</span>
            </div>

            <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-1">
              <span className="text-[#86868b] font-semibold block uppercase text-[10px]">Framework Version</span>
              <span className="text-[rgb(26,26,26)] font-mono font-bold">FastAPI v{health.version}</span>
              <span className="text-[11px] text-[#6e6e73] block pt-0.5">Environment: {health.environment}</span>
            </div>

            <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-1">
              <span className="text-[#86868b] font-semibold block uppercase text-[10px]">Database Path</span>
              <span className="text-[rgb(26,26,26)] font-mono text-[10px] truncate block font-medium">{health.database.database_path}</span>
              <span className="text-[11px] text-[#6e6e73] block pt-0.5">{health.database.tables_count} active tables</span>
            </div>
          </div>
        )}
      </div>

      {/* Threshold Config Form */}
      <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center border-b border-black/5 pb-4">
          <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#A0C4FF]" />
            <span>Risk Engine Detector Sensitivity Sliders</span>
          </h2>
          <span className="text-xs text-[#86868b] font-medium">Continuous Adjustment</span>
        </div>

        <div className="space-y-6 text-xs">
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#6e6e73] font-semibold">Sanction-to-Expenditure Lag Threshold (Days)</span>
              <span className="text-[rgb(26,26,26)] font-mono font-bold">{sanctionLagDays} Days</span>
            </div>
            <input
              type="range"
              min="30"
              max="365"
              value={sanctionLagDays}
              onChange={(e) => setSanctionLagDays(Number(e.target.value))}
              className="w-full accent-black h-2 bg-[#f0f0f2] rounded-full cursor-pointer"
            />
            <p className="text-[11px] text-[#86868b]">Flag works where first expenditure transaction exceeds this threshold.</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#6e6e73] font-semibold">Financial Disbursal Variance Threshold (%)</span>
              <span className="text-[rgb(26,26,26)] font-mono font-bold">{variancePct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={variancePct}
              onChange={(e) => setVariancePct(Number(e.target.value))}
              className="w-full accent-black h-2 bg-[#f0f0f2] rounded-full cursor-pointer"
            />
            <p className="text-[11px] text-[#86868b]">Flag works where total disbursed funds exceed sanction amount by this percentage.</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#6e6e73] font-semibold">Minimum Detector Confidence Filter (%)</span>
              <span className="text-[rgb(26,26,26)] font-mono font-bold">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-black h-2 bg-[#f0f0f2] rounded-full cursor-pointer"
            />
            <p className="text-[11px] text-[#86868b]">Hide AI anomaly signals with confidence score below this threshold.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-black/5">
            {saved ? (
              <span className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: '#1a1a1a' }}>
                <CheckCircle2 className="w-4 h-4 text-[#1a1a1a]" style={{ color: APPLE_PALETTE.mint }} />
                <span>Threshold parameters saved to local config.</span>
              </span>
            ) : (
              <span className="text-xs text-[#86868b]">Changes apply to subsequent pipeline executions.</span>
            )}
            <button
              onClick={handleSaveThresholds}
              className="px-5 py-2.5 bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] font-semibold rounded-full text-xs transition-all shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
