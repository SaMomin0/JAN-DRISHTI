'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Search, 
  Layers, 
  FileText, 
  CheckSquare, 
  ArrowRight 
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Connect the Data',
      desc: 'Ingest verified MPLADS datasets including recommended works, sanctions, and completion statements.',
      icon: Database,
    },
    {
      num: '02',
      title: 'Identify Patterns',
      desc: 'Run statistical detectors to spot unusual cost deviations, timeline lags, or description similarities.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Corroborate Evidence',
      desc: 'Link related signals, compare against peer constituency records, and evaluate terrain context.',
      icon: Layers,
    },
    {
      num: '04',
      title: 'Review the Risk Case',
      desc: 'Inspect explainable signal summaries, supporting evidence, counter-evidence, and data limitations.',
      icon: FileText,
    },
    {
      num: '05',
      title: 'Verify & Record',
      desc: 'Authorised monitoring officers record verification actions and maintain an auditable decision trail.',
      icon: CheckSquare,
    },
  ];

  return (
    <section id="how-it-works" className="py-28 bg-[#080c16] border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Radial Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyan-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
              04 / THE PROCESS
            </span>
            <span className="h-px w-12 bg-cyan-500/30" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            From detection to <span className="gradient-cyan-blue">accountable verification.</span>
          </h2>
        </div>

        {/* Process Timeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {/* Subtle Horizontal Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-cyan-500/20 z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10 flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md group hover:border-cyan-500/40 hover:bg-slate-900 transition-all"
              >
                <div className="space-y-4">
                  {/* Step Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/50 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-xs font-mono-tech font-extrabold text-cyan-400/80 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                      STEP {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-end text-slate-600 group-hover:text-cyan-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
