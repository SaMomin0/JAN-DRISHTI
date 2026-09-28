'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  FileText, 
  BarChart3, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  Info,
  Layers,
  Lock
} from 'lucide-react';

export const RiskCasePreview: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState(0);
  const [imgError, setImgError] = useState(false);

  const pillars = [
    {
      title: 'Project Under Review',
      desc: 'Sanctioned amount, recommended agency, constituency location, and work classification.',
    },
    {
      title: 'Detected Signals',
      desc: 'Statistical cost deviations, timeline flags, or description similarity scores.',
    },
    {
      title: 'Supporting Evidence',
      desc: 'Direct links to sanction orders, expenditure vouchers, or completion certificates.',
    },
    {
      title: 'Relevant Comparable Projects',
      desc: 'Peer group works evaluated under identical cost & geographic parameters.',
    },
    {
      title: 'Counter-Evidence & Context',
      desc: 'Terrain factors, calamity allocations, or special sanctions explaining variance.',
    },
    {
      title: 'Data Limitations',
      desc: 'Transparent indicators highlighting missing records or pending inspections.',
    },
    {
      title: 'Verification Recommendations',
      desc: 'Suggested physical audit checkpoints for district monitoring officers.',
    },
    {
      title: 'Auditable Officer Actions',
      desc: 'Immutable history of officer reviews, site visit logs, and resolution statuses.',
    },
  ];

  return (
    <section className="py-28 bg-[#050810] border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
              03 / INVESTIGATION
            </span>
            <span className="h-px w-12 bg-cyan-500/30" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Not just an anomaly. <br />
            <span className="gradient-cyan-blue">A complete Risk Case.</span>
          </h2>

          <p className="text-slate-300 text-base font-light leading-relaxed">
            A Risk Case brings together the signals, evidence, context, limitations, and verification actions associated with a project into a single, explainable view.
          </p>
        </div>

        {/* Editorial Split Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Side: 8 Core Risk Case Pillars */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-mono-tech uppercase tracking-wider text-slate-400 font-semibold mb-2">
              RISK CASE ARCHITECTURE PILLARS
            </div>

            {pillars.map((item, idx) => (
              <div
                key={item.title}
                onClick={() => setSelectedPillar(idx)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedPillar === idx
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span
                    className={`font-mono-tech text-xs font-bold px-2 py-0.5 rounded transition-colors ${
                      selectedPillar === idx
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Illustrative Risk Case UI Component */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Image Preview Overlay if provided */}
              {!imgError ? (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-800 max-h-48">
                  <img
                    src="/images/jan-drishti/risk-case-preview.webp"
                    alt="Illustrative Risk Case Preview"
                    onError={() => setImgError(true)}
                    className="w-full object-cover opacity-80"
                  />
                </div>
              ) : null}

              {/* Watermark Label */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-mono-tech text-amber-400 font-bold uppercase tracking-wider">
                    ILLUSTRATIVE RISK CASE PREVIEW
                  </span>
                </div>
                <span className="text-[10px] font-mono-tech text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                  DEMO SCHEMA ONLY
                </span>
              </div>

              {/* Case Header Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono-tech text-slate-400">PROJECT IDENTIFIER</div>
                    <div className="text-sm font-bold font-mono-tech text-white">
                      MPLADS-EXAMPLE-2024-MH-8921
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono-tech font-bold">
                    PRIORITY: MEDIUM REVIEW
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">Description: </span>
                  Construction of Community Center Water Storage & Filtration Unit
                </div>
              </div>

              {/* Signals & Peer Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono-tech text-cyan-400 font-semibold flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Detected Signals</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-light">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Cost exceeds peer mean by +28%</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Similar work description in district</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono-tech text-emerald-400 font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Data Quality Metric</span>
                  </div>
                  <div className="text-2xl font-bold font-mono-tech text-white">92%</div>
                  <div className="text-[11px] text-slate-400">High Record Integrity</div>
                </div>
              </div>

              {/* Responsible AI Disclaimer */}
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300/90 flex items-start space-x-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  Sample representation showing structural view. Live risk cases reflect verified MPLADS database records upon officer authentication.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
