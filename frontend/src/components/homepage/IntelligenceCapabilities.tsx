'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Clock, 
  CreditCard, 
  Copy, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

export const IntelligenceCapabilities: React.FC = () => {
  const capabilities = [
    {
      num: '01',
      title: 'Cost Anomaly',
      subtitle: 'Statistical Cost Deviation Engine',
      desc: 'Identify project costs that differ substantially from relevant comparable works within the same category or geographic region. The system explains the peer comparison group and quantifies observed variance.',
      status: 'OPERATIONAL',
      icon: DollarSign,
      color: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30',
      highlight: 'Peer Group Comparison Z-Score',
    },
    {
      num: '02',
      title: 'Timeline Deviation',
      subtitle: 'Schedule & Execution Tracking',
      desc: 'Identify unusual differences between project sanction dates, planned schedules, and completion records. Highlights unexpected execution delays or premature closure signals requiring review.',
      status: 'OPERATIONAL',
      icon: Clock,
      color: 'from-blue-500/20 to-indigo-500/10',
      border: 'border-blue-500/30',
      highlight: 'Sanction-to-Completion Lag Analysis',
    },
    {
      num: '03',
      title: 'Payment Pattern Analysis',
      subtitle: 'Expenditure Sequence Profiling',
      desc: 'Examine available expenditure records for unusual patterns in spending velocity or installment behavior across financial quarters to ensure alignment with milestone disbursements.',
      status: 'OPERATIONAL',
      icon: CreditCard,
      color: 'from-indigo-500/20 to-violet-500/10',
      border: 'border-indigo-500/30',
      highlight: 'Expenditure Tranche Clustering',
    },
    {
      num: '04',
      title: 'Potentially Similar Work',
      subtitle: 'Duplicate & Description Vector Matching',
      desc: 'Identify projects with potentially similar descriptions, categories, or contextual attributes across adjacent agencies. Similarity is a reason for physical verification, not proof of duplication or wrongdoing.',
      status: 'OPERATIONAL',
      icon: Copy,
      color: 'from-violet-500/20 to-purple-500/10',
      border: 'border-violet-500/30',
      highlight: 'Semantic Vector Similarity Index',
    },
    {
      num: '05',
      title: 'Progress Mismatch',
      subtitle: 'Financial vs. Physical Corroboration',
      desc: 'Compare financial utilisation rates with physical progress metrics when supported by verified field reports. Clearly highlights data gaps when physical progress records are unavailable.',
      status: 'OPERATIONAL',
      icon: TrendingUp,
      color: 'from-teal-500/20 to-cyan-500/10',
      border: 'border-teal-500/30',
      highlight: 'Physical-Financial Divergence Index',
    },
  ];

  return (
    <section id="intelligence" className="py-28 bg-[#080c16] border-t border-slate-800/80 relative overflow-hidden">
      {/* Subtle radial glow overlay */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold">
                02 / INTELLIGENCE
              </span>
              <span className="h-px w-12 bg-cyan-500/30" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Understand the patterns <br className="hidden sm:inline" />
              <span className="gradient-cyan-blue">behind every signal.</span>
            </h2>
          </div>

          <p className="text-slate-300 text-sm max-w-md font-light leading-relaxed border-l-2 border-slate-800 pl-4">
            JAN-DRISHTI brings multiple analytical perspectives together to help authorised officers investigate unusual project patterns and corroborate findings transparently.
          </p>
        </div>

        {/* 5 Capability Cards Grid (Omnera Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            const isWide = idx === 3 || idx === 4;

            return (
              <motion.div
                key={cap.num}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`p-7 rounded-2xl border ${cap.border} bg-slate-900/60 backdrop-blur-md relative flex flex-col justify-between group hover:shadow-xl hover:shadow-cyan-950/20 ${
                  isWide ? 'lg:col-span-1 md:col-span-1' : ''
                }`}
              >
                <div className="space-y-5">
                  {/* Top Bar: Number & Operational Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold font-mono-tech text-slate-500 group-hover:text-cyan-400 transition-colors">
                      {cap.num}
                    </span>

                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono-tech text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{cap.status}</span>
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/60 group-hover:scale-105 transition-all">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-wide pt-2">
                      {cap.title}
                    </h3>
                    <p className="text-xs font-mono-tech text-cyan-400/90 font-medium">
                      {cap.subtitle}
                    </p>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {cap.desc}
                  </p>
                </div>

                {/* Bottom Highlight Metric */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-tech text-slate-400">
                  <span className="truncate">{cap.highlight}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
