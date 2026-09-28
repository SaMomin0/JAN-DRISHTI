'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  History, 
  Search, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  X, 
  Lock,
  Sparkles
} from 'lucide-react';
import { MOCK_AUDIT_LOGS, AuditLogEntry } from '../../lib/mockData';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === 'ALL' || log.action_type === actionFilter;
    const matchesSearch = log.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.target_entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.ip_address.includes(searchQuery);
    return matchesAction && matchesSearch;
  });

  const handleExportLogs = (format: 'CSV' | 'JSON') => {
    triggerToast(`Exporting audit log trail in ${format} format...`);
    const dataStr = format === 'JSON' 
      ? JSON.stringify(logs, null, 2)
      : 'ID,Timestamp,Actor,Role,Action,Target,IP,Status\n' + logs.map(l => `${l.id},"${l.timestamp}","${l.actor_name}","${l.actor_role}",${l.action_type},"${l.target_entity}",${l.ip_address},${l.status}`).join('\n');
    
    const blob = new Blob([dataStr], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JAN-DRISHTI-Audit-Logs-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return { bg: APPLE_PALETTE.mint, text: '#1a1a1a' };
      case 'WARNING':
        return { bg: APPLE_PALETTE.peach, text: '#1a1a1a' };
      default:
        return { bg: APPLE_PALETTE.coral, text: '#1a1a1a' };
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-[rgb(26,26,26)] text-white font-semibold text-xs shadow-2xl flex items-center gap-2 border border-black/10 backdrop-blur-xl animate-scaleIn">
          <CheckCircle2 className="w-4 h-4 text-[#CAFFBF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#A0C4FF]" />
              <span>Immutable Governance Record</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <Lock className="w-7 h-7 text-[#A0C4FF]" />
              <span>System & Officer Audit Trail</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Append-only chronological log of all officer logins, risk score adjustments, evidence dossier exports, and status transitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportLogs('CSV')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] border border-black/10 text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportLogs('JSON')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Action Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-black/5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'LOGIN', 'RISK_SCORE_OVERRIDE', 'EXPORT_DOSSIER', 'INSPECTION_NOTE_ADDED', 'DATASET_INGESTED', 'STATUS_CHANGED'].map(act => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                actionFilter === act
                  ? 'bg-[rgb(26,26,26)] text-white shadow-xs'
                  : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
              }`}
            >
              {act === 'ALL' ? 'All Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, entity, details, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f5f5f7] border border-black/5 rounded-full pl-9 pr-4 py-2 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
          />
        </div>
      </div>

      {/* Audit Table (Apple Inset Grouped Table) */}
      <div className="rounded-3xl bg-white border border-black/5 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f7] text-[#6e6e73] font-mono border-b border-black/5 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 font-semibold">Timestamp (IST)</th>
                <th className="p-4 font-semibold">Actor & Role</th>
                <th className="p-4 font-semibold">Action Event</th>
                <th className="p-4 font-semibold">Target Entity</th>
                <th className="p-4 font-semibold">IP Address</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-sans">
              {filteredLogs.map(log => {
                const badge = getStatusBadge(log.status);

                return (
                  <tr key={log.id} className="hover:bg-[#fbfbfd] transition-colors">
                    <td className="p-4 font-mono text-[#6e6e73] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[rgb(26,26,26)]">{log.actor_name}</div>
                      <div className="text-[10px] text-[#86868b] font-mono">{log.actor_role}</div>
                    </td>
                    <td className="p-4 font-mono text-[rgb(26,26,26)] font-semibold">{log.action_type}</td>
                    <td className="p-4 font-mono text-[#6e6e73]">{log.target_entity}</td>
                    <td className="p-4 font-mono text-[#86868b]">{log.ip_address}</td>
                    <td className="p-4">
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#eaeaed] text-[rgb(26,26,26)] text-xs font-semibold transition-colors border border-black/5 shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal (Apple Sheet) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-black/10 p-6 space-y-4 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#86868b] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-black/5 pb-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${APPLE_PALETTE.blue}33`, color: '#1a1a1a' }}
              >
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#86868b] font-semibold">AUDIT EVENT RECORD</span>
                <h3 className="text-base font-semibold text-[rgb(26,26,26)]">{selectedLog.id} • {selectedLog.action_type}</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2 text-xs">
              <div className="flex justify-between text-[#6e6e73]">
                <span>Timestamp:</span>
                <span className="font-mono font-semibold text-[rgb(26,26,26)]">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between text-[#6e6e73]">
                <span>Actor:</span>
                <span className="text-[rgb(26,26,26)] font-semibold">{selectedLog.actor_name} ({selectedLog.actor_role})</span>
              </div>
              <div className="flex justify-between text-[#6e6e73]">
                <span>Target Entity:</span>
                <span className="font-mono font-semibold text-[rgb(26,26,26)]">{selectedLog.target_entity}</span>
              </div>
              <div className="flex justify-between text-[#6e6e73]">
                <span>Client IP Address:</span>
                <span className="font-mono text-[#86868b]">{selectedLog.ip_address}</span>
              </div>
              <div className="pt-2 border-t border-black/5">
                <span className="text-[#6e6e73] block mb-1 font-medium">Administrative Remarks / Payload:</span>
                <p className="text-[rgb(26,26,26)] leading-relaxed bg-[#f5f5f7] p-3 rounded-2xl border border-black/5 font-mono text-[11px]">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-full bg-[rgb(26,26,26)] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
