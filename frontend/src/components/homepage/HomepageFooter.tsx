'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowUpRight } from 'lucide-react';

export const HomepageFooter: React.FC = () => {
  return (
    <footer className="bg-[#050810] border-t border-slate-800/80 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-wider font-sans">
                JAN-DRISHTI
              </span>
            </div>
            <p className="text-xs font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
              Evidence-Linked Risk Intelligence for MPLADS
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-6 md:gap-8 text-xs font-mono-tech uppercase tracking-wider">
            <a href="#overview" className="hover:text-cyan-400 transition-colors">
              Overview
            </a>
            <a href="#intelligence" className="hover:text-cyan-400 transition-colors">
              Intelligence
            </a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
            <a href="#responsible-ai" className="hover:text-cyan-400 transition-colors">
              Responsible AI
            </a>
            <Link
              href="/risk"
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
            >
              <span>Command Centre</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>

        {/* Central Tagline & Ethical Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs font-mono-tech">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-300">
            <span className="text-cyan-400 font-bold uppercase block mb-1">PLATFORM TAGLINE</span>
            “A signal is not a verdict. It is a reason to investigate.”
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <span className="text-slate-300 font-bold uppercase block mb-1">ETHICAL & AUDIT COMPLIANCE</span>
            Designed to support authorised monitoring and verification. Analytical signals do not establish wrongdoing.
          </div>
        </div>

        {/* Copyright & Technical Stamp */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono-tech text-slate-400 gap-2">
          <div>
            © 2026 JAN-DRISHTI • Ministry of Statistics & Programme Implementation (MoSPI)
          </div>
          <div>Strictly Authorized Access • Version 1.0.0</div>
        </div>
      </div>
    </footer>
  );
};
