'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, X, BarChart3, FolderSearch, ShieldAlert, Cpu, FileSpreadsheet, Map, Bot, Settings, HelpCircle, History, FileCheck, ClipboardList, UploadCloud, PieChart } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pages = [
    { name: 'Executive Overview Dashboard', path: '/dashboard', icon: BarChart3, desc: 'Macro portfolio statistics & risk distribution' },
    { name: 'Work Records Directory', path: '/projects', icon: FolderSearch, desc: 'Search & filter 80,733 MPLADS works' },
    { name: 'Risk Cases & Evidence Dossier', path: '/risk', icon: ShieldAlert, desc: 'Corroborated AI anomaly investigation room' },
    { name: 'Geographic Risk Map', path: '/risk-map', icon: Map, desc: 'State & constituency distribution heatmap' },
    { name: 'Multivariate Visual Analytics', path: '/analytics', icon: PieChart, desc: 'Quarterly velocity and state risk league' },
    { name: 'AI Intelligence Assistant', path: '/ai', icon: Bot, desc: 'Natural language queries across SQLite database' },
    { name: 'Evidence Management', path: '/evidence', icon: FileCheck, desc: 'SHA-256 verified vouchers and field proof' },
    { name: 'Verification & Review Workbench', path: '/verification', icon: ClipboardList, desc: 'Field inspection checklist and review' },
    { name: 'Risk Engine Analysis Pipeline', path: '/analysis', icon: Cpu, desc: 'Deterministic 5-signal pipeline execution' },
    { name: 'Audit & Compliance Reports', path: '/reports', icon: FileSpreadsheet, desc: 'Official government audit report generator' },
    { name: 'Immutable Audit Logs', path: '/audit-logs', icon: History, desc: 'Tamper-evident system activity trail' },
    { name: 'Data Ingestion & Manual Entry', path: '/data-upload', icon: UploadCloud, desc: 'Ingest CSV/JSON files or enter work record' },
    { name: 'System Settings & Diagnostics', path: '/settings', icon: Settings, desc: 'Threshold config & database health' },
    { name: 'Help & Risk Glossary', path: '/help', icon: HelpCircle, desc: 'Documentation & responsible AI compliance' },
  ];

  const filtered = pages.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.desc.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-start justify-center pt-24 p-4">
      <div className="bg-[#0a0a0a] border border-white/15 border-t-white/30 rounded-3xl max-w-xl w-full overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/10 space-y-2">
        <div className="flex items-center px-5 border-b border-white/10">
          <Search className="w-5 h-5 text-neutral-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a page, command or query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-500 py-4 text-sm focus:outline-none font-sans"
          />
          <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">No matching commands found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.path);
                  }}
                  className="w-full text-left p-3 rounded-2xl hover:bg-white/[0.08] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white tracking-tight">{item.name}</div>
                      <div className="text-[11px] text-neutral-400">{item.desc}</div>
                    </div>
                  </div>
                  <kbd className="text-[10px] font-mono text-neutral-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10">↵</kbd>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
