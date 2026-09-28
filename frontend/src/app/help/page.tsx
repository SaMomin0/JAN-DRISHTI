'use client';

import React, { useState } from 'react';
import { HelpCircle, Search, ShieldAlert, ChevronDown, BookOpen, Layers, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is JAN-DRISHTI?',
      a: 'JAN-DRISHTI is an AI-powered risk intelligence and empirical monitoring platform built for MPLADS (Member of Parliament Local Area Development Scheme) implementation data across India.',
    },
    {
      q: 'How does the Five-Signal Risk Engine work?',
      a: 'The system runs 5 independent, explainable statistical detectors: 1) Financial Variance Detector, 2) Sanction-to-Expenditure Lag Detector, 3) Peer Constituency Benchmark Detector, 4) Vendor Disbursal Concentration Detector, and 5) Completion Record Reconciliation Detector.',
    },
    {
      q: 'Does an anomaly trigger prove corruption or fraud?',
      a: 'No. Strictly compliant with Responsible AI principles, anomaly indicators highlight statistical outliers and structural data gaps for authorized officer review. They do not constitute legal proof of wrongdoing.',
    },
    {
      q: 'How are risk scores (0-100) calculated?',
      a: 'Each work is evaluated across weighted risk factor scores based on empirical deviation from peer constituency benchmarks, then normalized into HIGH (score > 65), MEDIUM (35-65), or LOW (< 35) risk tiers.',
    },
    {
      q: 'Where does the data come from?',
      a: 'Data is ingested from official MoSPI CSV datasets, cleaned via automated reconciliation pipelines, and stored in a canonical SQLite database containing 80,733 work records.',
    },
  ];

  const glossary = [
    { term: 'Sanction Lag', desc: 'Number of elapsed days between work sanction date and the first recorded expenditure disbursal transaction.' },
    { term: 'Disbursal Variance', desc: 'The percentage difference between total fund disbursed to vendors and the sanctioned amount.' },
    { term: 'Peer Constituency Benchmark', desc: 'Average cost and timeline metrics calculated across peer works within the same State and Parliamentary Constituency.' },
    { term: 'Unspent Balance', desc: 'Remaining sanctioned fund amount that has not yet been disbursed to vendors.' },
  ];

  const filteredFaqs = faqs.filter(
    (f) => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-medium tracking-wider uppercase text-[rgb(26,26,26)] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#A0C4FF]" />
          <span>Documentation & Methodology</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
          <HelpCircle className="w-7 h-7 text-[#A0C4FF]" />
          <span>Documentation, Risk Glossary & FAQ</span>
        </h1>
        <p className="text-[#6e6e73] text-sm mt-1 max-w-2xl font-normal">
          Learn about the Five-Signal Intelligence Engine, risk methodologies, and Responsible AI guidelines.
        </p>
      </div>

      {/* Responsible AI Compliance Box */}
      <div className="bg-white border border-black/5 p-6 rounded-3xl flex items-start space-x-3 text-xs shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <Info className="w-5 h-5 text-[rgb(26,26,26)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[rgb(26,26,26)]">Responsible AI & Compliance Framework:</span>
          <p className="mt-1 text-[#6e6e73] leading-relaxed font-normal">
            JAN-DRISHTI enforces transparent, explainable AI scoring. System output presents statistical indicators to assist human decision-makers. No automated decision or score is treated as proof of misconduct.
          </p>
        </div>
      </div>

      {/* Five-Signal Detector Visual Flow */}
      <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#A0C4FF]" />
          <span>Five-Signal Intelligence Architecture</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
          {[
            { id: 1, name: 'Financial Variance', color: APPLE_PALETTE.sky },
            { id: 2, name: 'Sanction Lag', color: APPLE_PALETTE.blue },
            { id: 3, name: 'Peer Benchmark', color: APPLE_PALETTE.yellow },
            { id: 4, name: 'Vendor Disbursal', color: APPLE_PALETTE.mint },
            { id: 5, name: 'Completion Audit', color: APPLE_PALETTE.coral },
          ].map(sig => (
            <div key={sig.id} className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/5 space-y-1">
              <span className="font-mono font-semibold block text-[10px]" style={{ color: '#1a1a1a' }}>
                Signal {sig.id}
              </span>
              <span className="text-[rgb(26,26,26)] font-semibold block text-xs">{sig.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Glossary Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-[#BDB2FF]" />
          <span>Risk Engine Technical Glossary</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossary.map((g, idx) => (
            <div key={idx} className="bg-white border border-black/5 rounded-3xl p-5 space-y-1.5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <span className="text-xs font-semibold text-[rgb(26,26,26)] uppercase tracking-wider">{g.term}</span>
              <p className="text-xs text-[#6e6e73] leading-relaxed font-normal">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Searchable FAQ Accordion */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-3">
          <h2 className="text-sm font-semibold text-[rgb(26,26,26)]">Frequently Asked Questions</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f5f5f7] text-[rgb(26,26,26)] text-xs pl-9 pr-4 py-2 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="bg-white border border-black/5 rounded-2xl overflow-hidden text-xs transition-colors shadow-xs">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-[rgb(26,26,26)] flex justify-between items-center hover:bg-[#fbfbfd] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#86868b] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-1 text-[#6e6e73] border-t border-black/5 leading-relaxed font-normal bg-[#fbfbfd]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
