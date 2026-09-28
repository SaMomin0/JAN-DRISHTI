'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Check, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { MOCK_NOTIFICATIONS, NotificationItem } from '../../lib/mockData';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [showConfig, setShowConfig] = useState(false);

  const filtered = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    return n.severity === activeFilter;
  });

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearRead = () => {
    setNotifications(notifications.filter(n => !n.read));
  };

  const toggleRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? ({ ...n, read: !n.read }) : n));
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: APPLE_PALETTE.coral, text: '#1a1a1a' };
      case 'WARNING':
        return { bg: APPLE_PALETTE.peach, text: '#1a1a1a' };
      case 'INFO':
      default:
        return { bg: APPLE_PALETTE.blue, text: '#1a1a1a' };
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FFADAD]" />
              <span>Operational Alert Stream</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <Bell className="w-7 h-7 text-[#FFADAD]" />
              <span>Notifications Hub</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Real-time algorithmic alerts, inspection deadlines, and data synchronization updates across your assigned jurisdiction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] border border-black/10 text-xs font-semibold transition-all shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={clearRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] border border-black/10 text-xs font-semibold transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Read</span>
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] text-xs font-semibold transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Alert Rules</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-black/5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === tab
                  ? 'bg-[rgb(26,26,26)] text-white shadow-xs'
                  : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
              }`}
            >
              {tab === 'ALL' ? 'All Alerts' : tab}
              <span className="ml-1.5 text-[10px] font-mono opacity-70">
                ({tab === 'ALL' ? notifications.length : notifications.filter(n => n.severity === tab).length})
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-[#6e6e73] font-mono">
          Unread: <strong className="text-[rgb(26,26,26)]">{notifications.filter(n => !n.read).length}</strong>
        </div>
      </div>

      {/* Alert Rules Drawer / Panel */}
      {showConfig && (
        <div className="p-6 rounded-3xl bg-white border border-black/5 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)] animate-scaleIn">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h3 className="text-sm font-semibold text-[rgb(26,26,26)]">Configured Officer Alert Rules</h3>
            <span className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider font-semibold">Auto-Escalation Active</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
              <div className="font-semibold text-[rgb(26,26,26)]">Z-Score Threshold</div>
              <div className="text-[#6e6e73]">Trigger on cost deviance &gt; +2.5σ</div>
              <span 
                className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs"
                style={{ backgroundColor: APPLE_PALETTE.coral, color: '#1a1a1a' }}
              >
                ACTIVE
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
              <div className="font-semibold text-[rgb(26,26,26)]">Semantic Overlap Threshold</div>
              <div className="text-[#6e6e73]">Trigger on cosine match &gt; 90%</div>
              <span 
                className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs"
                style={{ backgroundColor: APPLE_PALETTE.yellow, color: '#1a1a1a' }}
              >
                ACTIVE
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
              <div className="font-semibold text-[rgb(26,26,26)]">Execution Lag Alert</div>
              <div className="text-[#6e6e73]">Trigger if stalled &gt; 180 days</div>
              <span 
                className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs"
                style={{ backgroundColor: APPLE_PALETTE.peach, color: '#1a1a1a' }}
              >
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white border border-black/5 text-[#6e6e73] space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-[#1a1a1a] mx-auto" style={{ color: APPLE_PALETTE.mint }} />
            <div className="text-sm font-semibold text-[rgb(26,26,26)]">No notifications in this view</div>
            <p className="text-xs">All alerts in this severity category have been cleared.</p>
          </div>
        ) : (
          filtered.map(item => {
            const sevStyle = getSeverityStyle(item.severity);

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.read
                    ? 'bg-white border-black/10 shadow-[0_2px_14px_rgba(0,0,0,0.04)]'
                    : 'bg-[#fafafc] border-black/5 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs"
                    style={{ backgroundColor: `${sevStyle.bg}40`, color: '#1a1a1a' }}
                  >
                    {item.severity === 'CRITICAL' ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : item.severity === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span 
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold shadow-xs"
                        style={{ backgroundColor: sevStyle.bg, color: sevStyle.text }}
                      >
                        {item.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[#6e6e73] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full border border-black/5 font-semibold">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-[#86868b] font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[rgb(26,26,26)]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#6e6e73] leading-relaxed font-normal max-w-3xl">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center self-end flex-shrink-0">
                  <button
                    onClick={() => toggleRead(item.id)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6e6e73] hover:text-[rgb(26,26,26)] bg-[#f5f5f7] hover:bg-[#eaeaed] border border-black/5 transition-colors font-semibold shadow-xs"
                  >
                    {item.read ? 'Mark Unread' : 'Mark Read'}
                  </button>

                  <Link
                    href={item.link}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[rgb(26,26,26)] hover:bg-black transition-all shadow-sm"
                  >
                    <span>Open Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
