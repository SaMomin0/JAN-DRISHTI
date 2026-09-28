'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { ProjectBase } from '../../types';
import { Map, Layers, Building2, ShieldAlert, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

const STATES_COORDINATES: Record<string, { lat: number; lng: number; count: number; riskCount: number }> = {
  'UTTAR PRADESH': { lat: 26.8467, lng: 80.9462, count: 12450, riskCount: 420 },
  'MAHARASHTRA': { lat: 19.7515, lng: 75.7139, count: 9800, riskCount: 310 },
  'BIHAR': { lat: 25.0961, lng: 85.3131, count: 8600, riskCount: 290 },
  'WEST BENGAL': { lat: 22.9868, lng: 87.855, count: 7200, riskCount: 210 },
  'TAMIL NADU': { lat: 11.1271, lng: 78.6569, count: 6500, riskCount: 180 },
  'MADHYA PRADESH': { lat: 22.9734, lng: 78.6569, count: 6100, riskCount: 190 },
  'RAJASTHAN': { lat: 27.0238, lng: 74.2179, count: 5800, riskCount: 160 },
  'KARNATAKA': { lat: 15.3173, lng: 75.7139, count: 5400, riskCount: 140 },
  'GUJARAT': { lat: 22.2587, lng: 71.1924, count: 4900, riskCount: 130 },
  'ANDHRA PRADESH': { lat: 15.9129, lng: 79.74, count: 4200, riskCount: 110 },
  'ODISHA': { lat: 20.9517, lng: 85.0985, count: 3900, riskCount: 95 },
  'PUNJAB': { lat: 31.1471, lng: 75.3412, count: 3100, riskCount: 80 },
  'KERALA': { lat: 10.8505, lng: 76.2711, count: 2800, riskCount: 65 },
};

export default function RiskMapPage() {
  const [selectedState, setSelectedState] = useState<string>('UTTAR PRADESH');
  const [projects, setProjects] = useState<ProjectBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStateProjects = async () => {
      setLoading(true);
      try {
        const res = await api.getProjects({ page: 1, page_size: 6, state: selectedState });
        setProjects(res.data || []);
      } catch (err) {
        console.error('Error fetching map state projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStateProjects();
  }, [selectedState]);

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#A0C4FF]" />
              <span>Geographic Intelligence Grid</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <Map className="w-7 h-7 text-[#A0C4FF]" />
              <span>National Risk & Work Distribution</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Regional distribution of 80,733 parliamentary works and cross-referenced risk indicator overlays across 28 States & UTs.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-[#f5f5f7] border border-black/5 px-4 py-2 rounded-full text-[#6e6e73] font-medium shadow-xs">
              Active State: <strong className="text-[rgb(26,26,26)] ml-1">{selectedState}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map Grid Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-black/5 pb-4">
              <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#A0C4FF]" />
                <span>State Risk Concentration Matrix</span>
              </h2>
              <span className="text-xs text-[#6e6e73]">Select state to inspect constituency works</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {Object.entries(STATES_COORDINATES).map(([stName, stData]) => {
                const isSelected = selectedState === stName;
                const isHighRisk = stData.riskCount > 200;
                const isMedRisk = stData.riskCount >= 100 && stData.riskCount <= 200;
                const riskColor = isHighRisk ? APPLE_PALETTE.coral : isMedRisk ? APPLE_PALETTE.peach : APPLE_PALETTE.mint;

                return (
                  <button
                    key={stName}
                    onClick={() => setSelectedState(stName)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[rgb(26,26,26)] text-white border-black shadow-md'
                        : 'bg-[#fbfbfd] border-black/5 text-[#6e6e73] hover:border-black/20 hover:text-[rgb(26,26,26)]'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate tracking-tight">{stName}</div>
                    <div className={`flex justify-between items-center text-[10px] font-mono mt-3 pt-2 border-t ${
                      isSelected ? 'border-white/10 text-neutral-300' : 'border-black/5 text-[#86868b]'
                    }`}>
                      <span>{stData.count.toLocaleString()} works</span>
                      <span 
                        className="font-bold px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${riskColor}40`,
                          color: isSelected ? '#ffffff' : '#1a1a1a'
                        }}
                      >
                        {stData.riskCount} risks
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heatmap Legend Note */}
          <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-wrap items-center justify-between text-xs gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#6e6e73] font-medium">Risk Intensity Scale:</span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: APPLE_PALETTE.coral, color: '#1a1a1a' }}
              >
                High (&gt;200 alerts)
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: APPLE_PALETTE.peach, color: '#1a1a1a' }}
              >
                Medium (100-200)
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
              >
                Low (&lt;100)
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#86868b]">
              Total 80,733 National Works Indexed
            </div>
          </div>
        </div>

        {/* Right Column: Selected State Portfolio Preview */}
        <div className="space-y-4">
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
            <div className="border-b border-black/5 pb-4">
              <div className="text-[11px] text-[#86868b] font-mono uppercase tracking-wider font-semibold">State Portfolio Dossier</div>
              <h3 className="text-xl font-semibold text-[rgb(26,26,26)] mt-1">{selectedState}</h3>
              <p className="text-xs text-[#6e6e73] mt-1">
                Canonical work records loaded from database for {selectedState}.
              </p>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#6e6e73]">
                <RefreshCw className="w-6 h-6 text-[rgb(26,26,26)] animate-spin mx-auto mb-2 opacity-70" />
                Loading state works...
              </div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#86868b]">No works found for this state.</div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[rgb(26,26,26)]">Constituency Works in {selectedState}:</div>
                {projects.map((p) => (
                  <Link
                    key={p.work_id}
                    href={`/projects/${encodeURIComponent(p.work_id)}`}
                    className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 hover:border-black/20 block transition-all space-y-1.5 text-xs shadow-xs"
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="text-[rgb(26,26,26)] font-mono">Work #{p.work_id}</span>
                      <span className="text-[rgb(26,26,26)] font-mono">₹{(p.sanction_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[#6e6e73] truncate">{p.mp_name} • {p.constituency}</div>
                    <div className="text-[10px] text-[#86868b] flex justify-between pt-1 border-t border-black/5">
                      <span>{p.work_category || 'Infrastructure'}</span>
                      <span className="text-[rgb(26,26,26)] flex items-center font-semibold">Inspect →</span>
                    </div>
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
