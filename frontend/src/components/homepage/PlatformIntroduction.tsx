'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  CheckCircle2, 
  Search, 
  Network, 
  ShieldAlert, 
  FileText, 
  UserCheck, 
  History,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const PlatformIntroduction: React.FC = () => {
  const [activeStep, setActiveStep] = useState(2); // default highlighting DETECTION stage
  const [imgError, setImgError] = useState(false);

  const workflowSteps = [
    {
      id: 'DATA',
      label: 'DATA',
      title: 'Data Ingestion',
      desc: 'Connects recommended works, sanctions, expenditure & completion data.',
      icon: Database,
    },
    {
      id: 'VALIDATION',
      label: 'VALIDATION',
      title: 'Structural Validation',
      desc: 'Checks schema consistency, record links, and data completeness.',
      icon: CheckCircle2,
    },
    {
      id: 'DETECTION',
      label: 'DETECTION',
      title: 'Anomaly Detection',
      desc: 'Applies statistical cost, timeline, and pattern discrepancy detectors.',
      icon: Search,
    },
    {
      id: 'CORROBORATION',
      label: 'CORROBORATION',
      title: 'Cross-Corroboration',
      desc: 'Links findings across comparable constituency works and historical baselines.',
      icon: Network,
    },
    {
      id: 'RISK CASE',
      label: 'RISK CASE',
      title: 'Risk Case Assembly',
      desc: 'Aggregates signals, data confidence, and peer comparisons into unified cases.',
      icon: ShieldAlert,
    },
    {
      id: 'EVIDENCE',
      label: 'EVIDENCE',
      title: 'Evidence Explorer',
      desc: 'Presents verified supporting documentation and counter-evidence transparently.',
      icon: FileText,
    },
    {
      id: 'VERIFICATION',
      label: 'VERIFICATION',
      title: 'Officer Workbench',
      desc: 'Empowers human monitoring officers to conduct targeted physical audits.',
      icon: UserCheck,
    },
    {
      id: 'AUDIT',
      label: 'AUDIT',
      title: 'Auditable History',
      desc: 'Logs officer decisions, verification notes, and status changes immutably.',
      icon: History,
    },
  ];

  return (
    <section id="overview" className="py-28 bg-[#050810] border-t border-slate-800/80 relative overflow-hidden">
      {/* Background glow & grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header Label */}
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
            01 / THE PLATFORM
          </span>
          <span className="h-px w-12 bg-cyan-500/30" />
        </div>

        {/* Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading & Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              From scattered records to <span className="gradient-cyan-blue">actionable intelligence.</span>
            </h2>

            <p className="text-slate-300 text-base leading-relaxed font-light">
              MPLADS implementation data can contain complex relationships across recommended works, sanctioned works, expenditure, completion records, and allocation information.
            </p>

            <p className="text-slate-400 text-sm leading-relaxed">
              JAN-DRISHTI connects available records and analytical signals to help authorized officers understand which projects may require closer verification—replacing manual spreadsheet cross-referencing with structured evidence.
            </p>

            {/* Quick Metrics Badge */}
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <div className="text-2xl font-bold font-mono-tech text-white">80,733</div>
                <div className="text-xs text-slate-400 mt-1">Works Processed</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <div className="text-2xl font-bold font-mono-tech text-cyan-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">Auditable Evidence</div>
              </div>
            </div>

            {/* Image Placeholder if user provides asset */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 relative">
              {!imgError ? (
                <img
                  src="/images/jan-drishti/platform-overview.webp"
                  alt="Platform Overview Architecture"
                  onError={() => setImgError(true)}
                  className="w-full h-48 object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                />
              ) : null}
            </div>
          </div>

          {/* Right Column: Workflow Flow Visualization */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-mono-tech text-slate-400 uppercase tracking-wider font-semibold flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>End-to-End Intelligence Pipeline</span>
              </span>
              <span className="text-[11px] font-mono-tech text-cyan-400/80">Hover steps to inspect</span>
            </div>

            {/* Interactive Workflow Node Sequence */}
            <div className="space-y-3">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;

                return (
                  <motion.div
                    key={step.id}
                    onMouseEnter={() => setActiveStep(idx)}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/40 translate-x-1'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono-tech text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono-tech text-cyan-400 font-semibold">
                              STEP 0{idx + 1}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-sm font-bold text-white tracking-wide">
                              {step.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-light">
                            {step.desc}
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center space-x-2 text-xs font-mono-tech text-slate-400">
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                          {step.label}
                        </span>
                        {idx < workflowSteps.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
