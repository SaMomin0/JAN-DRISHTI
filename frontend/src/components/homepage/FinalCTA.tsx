'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-32 bg-[#080c16] border-t border-slate-800/80 relative overflow-hidden text-white text-center">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial-hero opacity-80 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 space-y-10">
        {/* Subtle Brand Watermark Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono-tech text-cyan-400">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>JAN-DRISHTI COMMAND CENTRE</span>
        </div>

        {/* Oversized Editorial Heading */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-sans max-w-4xl mx-auto">
          Turn complex records into <br />
          <span className="gradient-cyan-blue">clearer investigations.</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Explore how JAN-DRISHTI connects project information, analytical signals, and evidence to support targeted verification of MPLADS implementation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 pt-4">
          <Link
            href="/risk"
            className="group inline-flex items-center justify-center space-x-3 px-9 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-xl shadow-cyan-950/50 border border-cyan-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Open Command Centre</span>
            <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#overview"
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <span>Explore the Platform</span>
          </a>
        </div>
      </div>
    </section>
  );
};
