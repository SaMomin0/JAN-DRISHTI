'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FileSearch, 
  Scale, 
  Eye, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';

export const ResponsibleAISection: React.FC = () => {
  const principles = [
    {
      num: '01',
      title: 'Evidence Before Conclusions',
      desc: 'Every statistical signal and anomaly tag is strictly traceable to underlying verified records and data sources.',
      icon: FileSearch,
    },
    {
      num: '02',
      title: 'Context Before Comparison',
      desc: 'Projects are evaluated against relevant peer groups considering category, cost scale, and regional attributes.',
      icon: Scale,
    },
    {
      num: '03',
      title: 'Transparency About Limitations',
      desc: 'The platform explicitly highlights data quality gaps, missing attributes, or pending field inputs.',
      icon: Eye,
    },
    {
      num: '04',
      title: 'Human-Led Verification',
      desc: 'System signals serve strictly as investigation aids. Only authorised monitoring officers make decisions.',
      icon: UserCheck,
    },
  ];

  return (
    <section id="responsible-ai" className="py-28 bg-[#050810] border-t border-slate-800/80 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
              05 / RESPONSIBLE INTELLIGENCE
            </span>
            <span className="h-px w-12 bg-cyan-500/30" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            A signal is not a verdict. <br />
            <span className="gradient-cyan-blue">Human judgment leads.</span>
          </h2>

          <p className="text-slate-300 text-base font-light leading-relaxed">
            JAN-DRISHTI is designed to support human investigation, not replace human judgment. Analytical indicators provide objective starting points for authorized review.
          </p>
        </div>

        {/* 4 Responsible AI Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.num}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-xs font-mono-tech font-bold text-slate-500">
                      {item.num}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Callout Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4 max-w-3xl">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
                MANDATORY ETHICAL COMPLIANCE
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Unusual patterns require review. They do not establish fraud, corruption, or wrongdoing.
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Analytical indicators strictly highlight statistical variances for authorized inspection. No administrative conclusions or legal determinations are formed automatically.
              </p>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-tech text-cyan-300 font-semibold whitespace-nowrap">
            STRICT AUDIT COMPLIANT
          </div>
        </div>
      </div>
    </section>
  );
};
