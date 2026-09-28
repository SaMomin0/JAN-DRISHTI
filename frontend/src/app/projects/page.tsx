'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { ProjectBase, PaginatedResponse } from '../../types';
import { 
  FolderSearch, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  IndianRupee, 
  Eye, 
  RefreshCw, 
  X, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

const INDIAN_STATES = [
  'ANDHRA PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH', 'DELHI', 'GUJARAT',
  'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR', 'JHARKHAND', 'KARNATAKA',
  'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'ODISHA', 'PUNJAB', 'RAJASTHAN',
  'TAMIL NADU', 'TELANGANA', 'UTTAR PRADESH', 'WEST BENGAL'
];

const WORK_STATUSES = ['Completed', 'In Progress', 'Sanctioned', 'Delayed', 'Stalled'];

export default function ProjectsPage() {
  const [projectsData, setProjectsData] = useState<PaginatedResponse<ProjectBase> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [mpNameSearch, setMpNameSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects({
        page,
        page_size: pageSize,
        mp_name: mpNameSearch.trim() || undefined,
        state: stateFilter || undefined,
        work_status: statusFilter || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
      });
      setProjectsData(data);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Error fetching projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, pageSize, stateFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const clearFilters = () => {
    setMpNameSearch('');
    setStateFilter('');
    setStatusFilter('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: APPLE_PALETTE.mint, text: '#1a1a1a', border: '#b6f2aa' };
      case 'in progress':
        return { bg: APPLE_PALETTE.blue, text: '#1a1a1a', border: '#8cb7fb' };
      case 'sanctioned':
        return { bg: APPLE_PALETTE.yellow, text: '#1a1a1a', border: '#f2f59f' };
      case 'delayed':
        return { bg: APPLE_PALETTE.peach, text: '#1a1a1a', border: '#f7c289' };
      case 'stalled':
      default:
        return { bg: APPLE_PALETTE.coral, text: '#1a1a1a', border: '#f89393' };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1500px] mx-auto pb-16">
      {/* Top Header Panel (Apple HIG Frosted Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#A0C4FF]" />
              <span>National Work Registry</span>
            </div>
            <h1 className="text-3xl font-semibold text-[rgb(26,26,26)] tracking-tight">
              MPLADS Work Records Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6e73] font-normal">
              Search, filter, and inspect canonical work records across all States & Parliamentary Constituencies.
            </p>
          </div>
          {projectsData && (
            <div className="text-xs font-mono text-[rgb(26,26,26)] bg-[#f5f5f7] border border-black/5 px-4 py-2 rounded-full self-start font-medium shadow-sm">
              Showing <span className="font-bold">{projectsData.pagination.total_records.toLocaleString()}</span> works
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar (Apple HIG Segmented Input Group) */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-black/5 p-6 rounded-3xl space-y-4 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by MP Name or Work Description..."
              value={mpNameSearch}
              onChange={(e) => setMpNameSearch(e.target.value)}
              className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] placeholder-[#86868b] text-xs pl-11 pr-4 py-3 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] text-xs px-4 py-3 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white cursor-pointer font-sans transition-all"
            >
              <option value="">All States / UTs</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] text-xs px-4 py-3 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white cursor-pointer font-sans transition-all"
            >
              <option value="">All Work Statuses</option>
              {WORK_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/5">
          <div className="flex items-center space-x-3 text-xs text-[#6e6e73]">
            <span className="font-semibold text-[rgb(26,26,26)]">Sanction Range (₹):</span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-32 bg-[#f5f5f7] text-[rgb(26,26,26)] placeholder-[#86868b] text-xs px-3 py-1.5 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-32 bg-[#f5f5f7] text-[rgb(26,26,26)] placeholder-[#86868b] text-xs px-3 py-1.5 rounded-full border border-black/5 focus:outline-none focus:border-black/20 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-full border border-black/10 bg-white hover:bg-[#f5f5f7] text-xs font-semibold text-[rgb(26,26,26)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[rgb(26,26,26)] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </form>

      {/* Projects Table (Apple Inset Grouped Table) */}
      <div className="rounded-3xl border border-black/5 bg-white backdrop-blur-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[rgb(26,26,26)] animate-spin mx-auto opacity-70" />
            <p className="text-[#6e6e73] text-sm font-medium">Querying canonical database records...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-[#ff3b30] text-sm">{error}</div>
        ) : !projectsData || projectsData.data.length === 0 ? (
          <div className="py-24 text-center text-[#6e6e73] text-sm">
            No work records matched the selected query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7] text-[#6e6e73] uppercase tracking-wider font-mono text-[10px] border-b border-black/5">
                <tr>
                  <th className="py-4 px-6 font-semibold">Work ID</th>
                  <th className="py-4 px-6 font-semibold">MP Name & Constituency</th>
                  <th className="py-4 px-6 font-semibold">State</th>
                  <th className="py-4 px-6 font-semibold">Description</th>
                  <th className="py-4 px-6 text-right font-semibold">Sanction Amount</th>
                  <th className="py-4 px-6 font-semibold text-center">Status</th>
                  <th className="py-4 px-6 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-sans">
                {projectsData.data.map((proj) => {
                  const statusStyle = getStatusColor(proj.work_status);

                  return (
                    <tr key={proj.work_id} className="hover:bg-[#fbfbfd] transition-colors">
                      <td className="py-4 px-6 font-mono font-medium text-[rgb(26,26,26)]">
                        {proj.work_id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[rgb(26,26,26)]">{proj.mp_name || 'Hon’ble MP'}</div>
                        <div className="text-[11px] text-[#86868b]">{proj.constituency || 'General Pool'}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[#6e6e73]">
                        {proj.state}
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-[#6e6e73]">
                        {proj.work_description || proj.work || 'Public Community Asset Development'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-[rgb(26,26,26)]">
                        {formatCurrency(proj.sanction_amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase font-semibold shadow-xs"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                          <span>{proj.work_status || 'In Progress'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          href={`/projects/${proj.work_id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/10 text-[rgb(26,26,26)] font-semibold text-[11px] shadow-sm transition-all"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 text-[#A0C4FF]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {projectsData && projectsData.pagination.total_pages > 1 && (
          <div className="p-4 border-t border-black/5 bg-[#fafafc] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6e6e73]">
            <div>
              Page <span className="text-[rgb(26,26,26)] font-bold">{page}</span> of{' '}
              <span className="text-[rgb(26,26,26)] font-bold">{projectsData.pagination.total_pages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white hover:bg-[#f5f5f7] text-xs font-semibold text-[rgb(26,26,26)] disabled:opacity-40 shadow-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= projectsData.pagination.total_pages}
                onClick={() => setPage((p) => Math.min(p + 1, projectsData.pagination.total_pages))}
                className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white hover:bg-[#f5f5f7] text-xs font-semibold text-[rgb(26,26,26)] disabled:opacity-40 shadow-sm flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
