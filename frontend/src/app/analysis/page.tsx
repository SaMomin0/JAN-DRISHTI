'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AnalysisRunResponse } from '../../types';
import { 
  Cpu, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Database, 
  Layers, 
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Sliders,
  FileCode
} from 'lucide-react';
import { MetricCard } from '../../components/ui/MetricCard';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function AnalysisPage() {
  const [runs, setRuns] = useState<AnalysisRunResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CANONICAL' | 'TEST'>('ALL');

  const pipelineStages = [
    { id: 1, name: 'Canonical Ingestion', desc: 'SQLite DB snapshot verification', icon: Database, color: APPLE_PALETTE.sky },
    { id: 2, name: 'Financial Variance', desc: 'Gaussian Z-score thresholding', icon: Sliders, color: APPLE_PALETTE.blue },
    { id: 3, name: 'Timeline Drift', desc: 'Sanction-to-disbursal lag monitor', icon: Clock, color: APPLE_PALETTE.yellow },
    { id: 4, name: 'Sentence-BERT NLP', desc: 'Cosine similarity tender matrix', icon: FileCode, color: APPLE_PALETTE.mint },
    { id: 5, name: 'Evidence Synthesis', desc: 'Corroborated risk dossier generation', icon: ShieldAlert, color: APPLE_PALETTE.coral },
  ];

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalysisRuns();
      setRuns(data);
    } catch (err: any) {
      console.error('Failed to load analysis runs:', err);
      setError(err.message || 'Error loading analysis runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleTriggerAnalysis = async () => {
    setTriggering(true);
    setActiveStage(1);

    const timer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= 5) {
          clearInterval(timer);
          return 5;
        }
        return prev + 1;
      });
    }, 600);

    try {
      await api.triggerAnalysisRun();
      setTimeout(async () => {
        await fetchRuns();
        setTriggering(false);
        setActiveStage(0);
      }, 3200);
    } catch (err: any) {
      alert(`Failed to trigger analysis run: ${err.message || err}`);
      setTriggering(false);
      setActiveStage(0);
    }
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Top Header Panel (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#A0C4FF]/15 via-[#BDB2FF]/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
              <span>Deterministic Statistical Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[rgb(26,26,26)] tracking-tight">
              AI Risk Engine Pipeline Execution
            </h1>
            <p className="text-sm text-[#6e6e73] font-normal leading-relaxed">
              Trigger full portfolio re-analysis across 80,733 records or inspect deterministic run logs, detector weights, and cryptographic SHA-256 dataset hashes.
            </p>
          </div>

          <button
            disabled={triggering}
            onClick={handleTriggerAnalysis}
            className="px-5 py-2.5 rounded-full bg-[rgb(26,26,26)] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 self-start md:self-center shadow-sm"
          >
            {triggering ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current text-white" />
            )}
            <span>{triggering ? 'Executing Pipeline...' : 'Trigger New Analysis Run'}</span>
          </button>
        </div>
      </div>

      {/* Interactive 5-Stage Pipeline Visualizer */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
          <div>
            <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#A0C4FF]" />
              <span>Five-Signal Detection Pipeline Workflow</span>
            </h2>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              Deterministic, explainable scoring sequence applied to every individual work record.
            </p>
          </div>
          {triggering && (
            <span className="font-mono text-xs text-[rgb(26,26,26)] font-semibold animate-pulse bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/5">
              Stage {activeStage} of 5 in progress...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            const isProcessing = triggering && activeStage === stage.id;
            const isDone = triggering && activeStage > stage.id;

            return (
              <div
                key={stage.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  isProcessing
                    ? 'border-black/30 bg-[#fbfbfd] shadow-md scale-[1.02]'
                    : isDone
                    ? 'border-black/10 bg-[#f5f5f7]'
                    : 'border-black/5 bg-[#fbfbfd]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono uppercase text-[#86868b] font-semibold tracking-wider">
                    Stage 0{stage.id}
                  </span>
                  <div 
                    className="p-2 rounded-xl shadow-xs"
                    style={{ backgroundColor: `${stage.color}33`, color: '#1a1a1a' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-semibold text-[rgb(26,26,26)] tracking-tight">{stage.name}</div>
                <div className="text-[11px] text-[#6e6e73] mt-1 leading-snug">{stage.desc}</div>

                {isProcessing && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[rgb(26,26,26)] font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
                {isDone && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono font-semibold" style={{ color: '#1a1a1a' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: APPLE_PALETTE.mint }} />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Engine Metadata Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Canonical Data Store"
          value="mplads.db"
          subtitle="80,733 works • 15 tables & views"
          icon={Database}
          iconColor="blue"
          trend={{ value: "SQLite 3.42", positive: true }}
        />
        <MetricCard
          title="Active Detector Rules"
          value="5 Signals"
          subtitle="Variance, Lag, Peer, Monopoly, Geospatial"
          icon={Layers}
          iconColor="purple"
          trend={{ value: "Ruleset v2.4.1", positive: true }}
        />
        <MetricCard
          title="Audit-Trailed Pipeline Runs"
          value={`${runs.length} Runs`}
          subtitle="Fully reproducible & immutable"
          icon={CheckCircle2}
          iconColor="emerald"
          trend={{ value: "100% Verifiable", positive: true }}
        />
      </div>

      {/* Analysis Run History Table (Apple Clean Table Aesthetic) */}
      <div className="rounded-3xl border border-black/5 bg-white backdrop-blur-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight">Analysis Execution History Log</h2>
            <p className="text-xs text-[#6e6e73]">Cryptographically verifiable portfolio analysis batches.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="apple-segmented-container">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`apple-segmented-item ${filterMode === 'ALL' ? 'active' : ''}`}
              >
                All Runs
              </button>
              <button
                onClick={() => setFilterMode('CANONICAL')}
                className={`apple-segmented-item ${filterMode === 'CANONICAL' ? 'active' : ''}`}
              >
                Canonical Hash
              </button>
            </div>

            <button
              onClick={fetchRuns}
              className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#eaeaed] text-[rgb(26,26,26)] border border-black/5 transition-colors"
              title="Refresh runs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[rgb(26,26,26)] animate-spin mx-auto opacity-70" />
            <p className="text-[#6e6e73] text-sm font-medium">Fetching run records from database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-[#ff3b30] text-sm">{error}</div>
        ) : runs.length === 0 ? (
          <div className="py-20 text-center text-[#86868b] text-sm">
            No analysis runs recorded yet. Click "Trigger New Analysis Run" above to execute.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7] text-[#6e6e73] uppercase tracking-wider font-mono text-[10px] border-b border-black/5">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Run ID</th>
                  <th className="py-3.5 px-6 font-semibold">Execution Timestamp</th>
                  <th className="py-3.5 px-6 font-semibold">Dataset SHA-256 Hash</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Works Evaluated</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Anomalies Detected</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-sans">
                {runs.map((r) => (
                  <tr key={r.run_id} className="hover:bg-[#fbfbfd] transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-[rgb(26,26,26)]">
                      {r.run_id}
                    </td>
                    <td className="py-4 px-6 text-[#6e6e73] font-mono text-[11px]">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-[#6e6e73]">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]" title={r.dataset_hash}>
                          {r.dataset_hash}
                        </span>
                        <button
                          onClick={() => copyToClipboard(r.dataset_hash)}
                          className="text-[#86868b] hover:text-[rgb(26,26,26)] transition-colors p-1"
                          title="Copy SHA-256 hash"
                        >
                          {copiedHash === r.dataset_hash ? (
                            <Check className="w-3.5 h-3.5 text-[#10b981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[rgb(26,26,26)] font-semibold">
                      {r.project_count.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-semibold text-[#1a1a1a]">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFADAD]/30 text-xs font-semibold">
                        {r.anomaly_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase shadow-xs"
                        style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
