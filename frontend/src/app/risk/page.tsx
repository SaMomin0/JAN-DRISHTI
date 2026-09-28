'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { RiskCaseListItem, PaginatedResponse } from '../../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Filter, 
  RefreshCw,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function RiskCasesPage() {
  const [casesData, setCasesData] = useState<PaginatedResponse<RiskCaseListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  // Status update modal
  const [selectedCase, setSelectedCase] = useState<RiskCaseListItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('UNDER_REVIEW');
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskCases({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setCasesData(data);
    } catch (err: any) {
      console.error('Failed to fetch risk cases:', err);
      setError(err.message || 'Error loading risk cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter, priorityFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedCase) return;
    setUpdating(true);
    try {
      await api.updateRiskCaseStatus(selectedCase.case_id, newStatus, verificationNotes);
      setSelectedCase(null);
      setVerificationNotes('');
      fetchCases();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || err}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return { bg: APPLE_PALETTE.coral, text: '#1a1a1a', border: '#fca5a5' };
      case 'HIGH':
        return { bg: APPLE_PALETTE.peach, text: '#1a1a1a', border: '#fdba74' };
      case 'MEDIUM':
        return { bg: APPLE_PALETTE.yellow, text: '#1a1a1a', border: '#fef08a' };
      case 'LOW':
      default:
        return { bg: APPLE_PALETTE.mint, text: '#1a1a1a', border: '#86efac' };
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FFADAD]" />
              <span>Active Investigation Docket</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-[#FFADAD]" />
              <span>Risk Cases & Intelligence</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Corroborated investigation cases generated from multi-signal anomaly detections, satellite verification, and field audits.
            </p>
          </div>
          <button
            onClick={fetchCases}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] text-xs font-semibold rounded-full border border-black/10 transition-all self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Cases</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Apple HIG Segmented Input Group) */}
      <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-[0_2px_14px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-medium text-[#6e6e73]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#86868b]" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#f5f5f7] text-[rgb(26,26,26)] text-xs px-3.5 py-1.5 rounded-full border border-black/5 focus:outline-none focus:border-black/20 font-medium transition-all"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="bg-[#f5f5f7] text-[rgb(26,26,26)] text-xs px-3.5 py-1.5 rounded-full border border-black/5 focus:outline-none focus:border-black/20 font-medium transition-all"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {(statusFilter || priorityFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); setPage(1); }}
              className="text-xs text-[#86868b] hover:text-[rgb(26,26,26)] underline underline-offset-4 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {casesData && (
          <div className="text-xs font-mono text-[#6e6e73]">
            Showing <span className="text-[rgb(26,26,26)] font-bold">{casesData.data.length}</span> of <span className="text-[rgb(26,26,26)] font-bold">{casesData.pagination.total_records.toLocaleString()}</span> dossiers
          </div>
        )}
      </div>

      {/* Cases List (Apple Inset Grouped Cards) */}
      <div className="rounded-3xl bg-white border border-black/5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-[rgb(26,26,26)] animate-spin mx-auto opacity-70" />
            <p className="text-[#6e6e73] text-sm font-medium">Querying verified case dossiers...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-[#ff3b30] text-sm">{error}</div>
        ) : !casesData || casesData.data.length === 0 ? (
          <div className="py-20 text-center text-[#6e6e73] text-sm">
            No risk cases match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {casesData.data.map((item) => {
              const priorityStyle = getPriorityStyle(item.priority);

              return (
                <div 
                  key={item.case_id} 
                  className="p-6 hover:bg-[#fbfbfd] transition-colors space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span 
                        className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase shadow-xs"
                        style={{
                          backgroundColor: priorityStyle.bg,
                          color: priorityStyle.text,
                        }}
                      >
                        {item.priority} PRIORITY
                      </span>
                      <span className="font-mono text-xs text-[#86868b]">Dossier #{item.case_id}</span>
                      <span className="text-[#d1d1d6]">•</span>
                      <span className="font-mono text-xs font-semibold text-[rgb(26,26,26)]">Work #{item.work_id}</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs px-3 py-1 bg-[#f5f5f7] border border-black/5 rounded-full font-mono text-[rgb(26,26,26)] font-medium">
                        {item.case_status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCase(item);
                          setNewStatus(item.case_status);
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] text-xs font-medium rounded-full border border-black/10 flex items-center space-x-1.5 transition-all shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#86868b]" />
                        <span>Update Status</span>
                      </button>
                      <Link
                        href={`/projects/${encodeURIComponent(item.work_id)}`}
                        className="px-4 py-1.5 bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] text-xs font-semibold rounded-full flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-[#fbfbfd] p-4 rounded-2xl border border-black/5">
                    <div>
                      <span className="text-[#86868b] block mb-0.5 font-medium">Hon'ble MP & Constituency</span>
                      <span className="font-semibold text-[rgb(26,26,26)]">{item.mp_name || 'N/A'} • {item.state} ({item.constituency})</span>
                    </div>
                    <div>
                      <span className="text-[#86868b] block mb-0.5 font-medium">Sanctioned Outlay</span>
                      <span className="font-bold font-mono text-[rgb(26,26,26)] text-sm">{formatCurrency(item.sanction_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[#86868b] block mb-0.5 font-medium">Signals Corroborated</span>
                      <span className="font-mono text-[#6e6e73] font-medium">{item.signal_count} anomalies • {item.evidence_count} evidence records</span>
                    </div>
                  </div>

                  {item.verification_recommendation && (
                    <p className="text-xs text-[#6e6e73] bg-[#f5f5f7] p-3 rounded-2xl border border-black/5 leading-relaxed font-sans">
                      <span className="text-[rgb(26,26,26)] font-semibold">Recommendation: </span>
                      {item.verification_recommendation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {casesData && casesData.pagination.total_pages > 1 && (
          <div className="p-4 border-t border-black/5 bg-[#fafafc] flex items-center justify-between text-xs text-[#6e6e73]">
            <div>
              Page <span className="font-bold text-[rgb(26,26,26)]">{casesData.pagination.page}</span> of <span className="font-bold text-[rgb(26,26,26)]">{casesData.pagination.total_pages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={casesData.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-full bg-white border border-black/10 hover:bg-[#f5f5f7] text-[rgb(26,26,26)] font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={casesData.pagination.page >= casesData.pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-black/10 hover:bg-[#f5f5f7] text-[rgb(26,26,26)] font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Status Update (Apple Sheet) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="text-base font-semibold text-[rgb(26,26,26)] flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-[#FFADAD]" />
                <span>Update Dossier #{selectedCase.case_id}</span>
              </h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-full text-[#86868b] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[rgb(26,26,26)] block mb-1.5 font-semibold">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-black/30 text-xs font-medium"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="ESCALATED">ESCALATED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="text-[rgb(26,26,26)] block mb-1.5 font-semibold">Officer Audit Findings / Notes</label>
                <textarea
                  rows={4}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Record ground verification observations, GIS satellite cross-references, or inquiry findings..."
                  className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] p-3 rounded-xl border border-black/10 focus:outline-none focus:border-black/30 text-xs placeholder:text-[#86868b]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-black/5">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-full border border-black/10 text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm"
              >
                {updating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Status</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
