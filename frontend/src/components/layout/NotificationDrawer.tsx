'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { AISignalItem } from '../../types';
import { Bell, X, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { APPLE_PALETTE } from '../charts/AppleCharts';

export const NotificationDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [signals, setSignals] = useState<AISignalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const data = await api.getAISignals({ page: 1, page_size: 10 });
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
        className="relative p-2 text-[#6e6e73] hover:text-[rgb(26,26,26)] rounded-full hover:bg-neutral-100 transition-colors"
        aria-label="Open notifications"
        title="Surveillance Alerts"
      >
        <Bell className="w-4 h-4" />
        {signals.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6176] rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="bg-white border-l border-black/10 w-full max-w-md h-full flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-black/5 flex justify-between items-center bg-[#fbfbfd]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFD6A5]/40 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[rgb(26,26,26)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[rgb(26,26,26)] tracking-tight">Surveillance Alerts</h3>
                  <p className="text-[10px] text-[#86868b]">Real-time risk signals & anomaly events</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#86868b] hover:text-[rgb(26,26,26)] p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfbfd]">
              {loading ? (
                <div className="py-16 text-center text-xs text-[#86868b] space-y-2">
                  <RefreshCw className="w-5 h-5 text-[rgb(26,26,26)] animate-spin mx-auto" />
                  <div>Synthesizing live AI alerts from master database...</div>
                </div>
              ) : signals.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#86868b]">No active alerts recorded.</div>
              ) : (
                signals.map((sig) => (
                  <div
                    key={sig.signal_id}
                    className="p-4 rounded-2xl bg-white border border-black/5 hover:border-black/15 shadow-xs transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider font-semibold">
                        {sig.signal_type || 'ANOMALY_SIGNAL'}
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FFD6A5]/50 text-[rgb(26,26,26)] font-bold uppercase">
                        {sig.severity || 'HIGH'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[rgb(26,26,26)] tracking-tight leading-snug">
                      {sig.reason}
                    </div>
                    
                    <div className="text-[11px] text-[#86868b] flex items-center justify-between pt-1">
                      <span>Work ID: <strong className="text-[rgb(26,26,26)] font-mono">{sig.entity_id}</strong></span>
                      <span>{sig.state || 'All States'}</span>
                    </div>

                    <div className="pt-2 border-t border-black/5 flex justify-end">
                      <Link
                        href={`/projects/${sig.entity_id}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[rgb(26,26,26)] hover:underline"
                      >
                        <span>Examine Record</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-black/5 bg-white flex justify-between items-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[rgb(26,26,26)] hover:underline"
              >
                View Full Alert Hub →
              </Link>
              <button
                onClick={fetchSignals}
                className="p-2 text-[#86868b] hover:text-[rgb(26,26,26)] rounded-full hover:bg-neutral-100 transition-colors"
                title="Refresh Live Signals"
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
