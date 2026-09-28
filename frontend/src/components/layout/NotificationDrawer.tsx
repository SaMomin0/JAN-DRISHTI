'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { AISignalItem } from '../../types';
import { Bell, X, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [signals, setSignals] = useState<AISignalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const data = await api.getAISignals({ page: 1, page_size: 10, severity: 'REVIEW' });
      setSignals(data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {signals.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="bg-[#0a0a0a] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#000000]">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white tracking-tight">Active Surveillance Alerts</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
                  <RefreshCw className="w-5 h-5 text-white animate-spin mx-auto" />
                  <div>Synthesizing live AI alerts...</div>
                </div>
              ) : signals.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-500">No active alerts recorded.</div>
              ) : (
                signals.map((sig) => (
                  <div
                    key={sig.signal_id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">
                        {sig.signal_type}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-bold uppercase">
                        {sig.severity}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white tracking-tight">{sig.reason}</div>
                    
                    <div className="text-[11px] text-neutral-400">
                      Entity: <span className="text-white font-mono">{sig.entity_id}</span> • {sig.state}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-end">
                      <Link
                        href={`/projects/${sig.entity_id}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-white hover:underline font-semibold"
                      >
                        <span>Inspect Record</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#000000] flex justify-between items-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-white hover:underline font-mono uppercase tracking-wider"
              >
                View Notifications Hub →
              </Link>
              <button
                onClick={fetchSignals}
                className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.08]"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
