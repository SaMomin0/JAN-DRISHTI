'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  Layers, 
  Database, 
  Activity, 
  Sparkles,
  FileCheck
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative min-h-screen pt-32 pb-24 flex flex-col justify-between overflow-hidden bg-[#050810] text-white">
      {/* Background Image / Canvas Fallback */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!imgError ? (
          <img
            src="/images/jan-drishti/hero-background.webp"
            alt="Public Infrastructure Risk Intelligence Overlay"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover opacity-25 filter contrast-125 brightness-75 scale-105 transform transition-transform duration-1000"
          />
        ) : null}

        {/* Topographic Grid & Radial Dark Overlays */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-radial-hero opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-transparent to-[#050810]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050810] via-[#050810]/60 to-[#050810]" />

        {/* Ambient Animated Data Particles / Glow Orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex-1 flex flex-col justify-center my-auto">
        <div className="max-w-4xl space-y-8">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono-tech uppercase tracking-widest text-cyan-300 font-semibold">
              EVIDENCE-LINKED RISK INTELLIGENCE FOR MPLADS
            </span>
          </motion.div>

          {/* Oversized Heading Inspired by Omnera */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-2"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] font-sans">
              See the signal.
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight gradient-cyan-blue leading-[1.05] font-sans">
              Understand the evidence.
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-300 leading-[1.05] font-sans">
              Guide the investigation.
            </h1>
          </motion.div>

          {/* Supporting Statement */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed border-l-2 border-cyan-500/40 pl-5"
          >
            JAN-DRISHTI helps authorised monitoring officers identify unusual patterns across MPLADS implementation data, connect supporting evidence, and focus verification where it matters most.
          </motion.p>

          {/* Primary & Secondary Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 pt-4"
          >
            <Link
              href="/risk"
              className="group inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-xl shadow-cyan-900/40 border border-cyan-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Command Centre</span>
              <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#overview"
              className="inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 backdrop-blur-md transition-all"
            >
              <span>Understand the Intelligence</span>
            </a>
          </motion.div>

          {/* Trust Statement Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="pt-6 flex items-center space-x-3 text-xs font-mono-tech text-cyan-400/90"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="tracking-wide">
              PRIMARY PRINCIPLE: <strong className="text-white font-semibold">A signal is not a verdict. It is a reason to investigate.</strong>
            </span>
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom Bar / Scroll Indicator */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-12 flex flex-col md:flex-row items-center justify-between border-t border-slate-800/60 text-slate-400 text-xs font-mono-tech gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-slate-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>80,733 MPLADS Works Indexed</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2 text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Multi-Dataset Vector Corroboration</span>
          </div>
        </div>

        <a
          href="#overview"
          className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors group cursor-pointer"
        >
          <span>SCROLL TO DISCOVER</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
        </a>
      </div>
    </section>
  );
};
