'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Calendar, 
  CheckSquare, 
  XCircle, 
  Send, 
  Building2, 
  FileText, 
  MapPin, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { MOCK_VERIFICATIONS, VerificationTask } from '../../lib/mockData';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function VerificationPage() {
  const [tasks, setTasks] = useState<VerificationTask[]>(MOCK_VERIFICATIONS);
  const [selectedTask, setSelectedTask] = useState<VerificationTask>(tasks[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [determination, setDetermination] = useState<'CLEARED' | 'MORE_DOCS' | 'ESCALATE'>('CLEARED');
  const [officerNote, setOfficerNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStat = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.work_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStat && matchesSearch;
  });

  const handleToggleCheckpoint = (taskIdx: number, cpIdx: number) => {
    const updatedTasks = [...tasks];
    const currentStatus = updatedTasks[taskIdx].checkpoints[cpIdx].status;
    const nextStatus = currentStatus === 'Passed' ? 'Failed' : currentStatus === 'Failed' ? 'Pending' : 'Passed';
    updatedTasks[taskIdx].checkpoints[cpIdx].status = nextStatus;
    setTasks(updatedTasks);
    triggerToast(`Checkpoint marked as ${nextStatus}.`);
  };

  const handleSubmitDetermination = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast(`Determination "${determination}" submitted for ${selectedTask.work_id}.`);
    setOfficerNote('');
  };

  const getCheckpointStyle = (status: string) => {
    switch (status) {
      case 'Passed':
        return { bg: APPLE_PALETTE.mint, text: '#1a1a1a' };
      case 'Failed':
        return { bg: APPLE_PALETTE.coral, text: '#1a1a1a' };
      default:
        return { bg: APPLE_PALETTE.yellow, text: '#1a1a1a' };
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-fadeIn pb-16">
      {/* Toast */}
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
              <Sparkles className="w-3.5 h-3.5 text-[#CAFFBF]" />
              <span>Field Verification Workbench</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <ClipboardList className="w-7 h-7 text-[#A0C4FF]" />
              <span>Verification & Review Portal</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Conduct standardized physical on-site audits, record checklist compliance, and submit conclusive determinations.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[#6e6e73] bg-[#f5f5f7] px-4 py-2 rounded-full border border-black/5 font-semibold shadow-xs">
            <span>Active Tasks:</span>
            <span className="text-[rgb(26,26,26)] font-bold">{tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Task List & Active Inspection Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Task Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-3xl border border-black/5 shadow-xs">
            {['ALL', 'Scheduled', 'Field Visit Completed', 'Report Submitted'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[rgb(26,26,26)] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
                }`}
              >
                {st === 'ALL' ? 'All Tasks' : st}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredTasks.map((t) => {
              const isSelected = selectedTask.task_id === t.task_id;
              return (
                <div
                  key={t.task_id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-white border-black/40 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                      : 'bg-white border-black/5 hover:border-black/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[rgb(26,26,26)] font-semibold">{t.task_id}</span>
                    <span 
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold shadow-xs"
                      style={{
                        backgroundColor: t.priority === 'CRITICAL' ? APPLE_PALETTE.coral : t.priority === 'HIGH' ? APPLE_PALETTE.peach : APPLE_PALETTE.yellow,
                        color: '#1a1a1a'
                      }}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-[rgb(26,26,26)] leading-snug">
                    {t.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-[#6e6e73] pt-2 border-t border-black/5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#86868b]" />
                      <span className="truncate max-w-[150px]">{t.location}</span>
                    </span>
                    <span className="font-mono text-[#86868b]">Due: {t.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Active Inspection Workbench */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-black/5 space-y-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <div className="space-y-2 border-b border-black/5 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[rgb(26,26,26)] bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/5">
                  {selectedTask.task_id} • {selectedTask.status}
                </span>
                <Link
                  href={`/projects/${selectedTask.work_id}`}
                  className="text-xs font-semibold text-[rgb(26,26,26)] hover:underline flex items-center gap-1"
                >
                  <span>Work: {selectedTask.work_id}</span>
                  <ExternalLink className="w-3 h-3 text-[#A0C4FF]" />
                </Link>
              </div>
              <h2 className="text-lg font-semibold text-[rgb(26,26,26)]">{selectedTask.title}</h2>
              <div className="text-xs text-[#6e6e73] flex flex-wrap gap-4 pt-1">
                <span>Inspector: <strong className="text-[rgb(26,26,26)]">{selectedTask.assigned_inspector}</strong></span>
                <span>•</span>
                <span>Deadline: <strong className="text-[rgb(26,26,26)]">{selectedTask.deadline}</strong></span>
              </div>
            </div>

            {/* Checkpoints Interactive Section */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#6e6e73] font-semibold">
                Physical Checkpoints (Click to toggle Passed / Failed / Pending)
              </h3>
              <div className="space-y-2">
                {selectedTask.checkpoints.map((cp, cpIdx) => {
                  const cpStyle = getCheckpointStyle(cp.status);

                  return (
                    <div
                      key={cpIdx}
                      onClick={() => handleToggleCheckpoint(tasks.findIndex(t => t.task_id === selectedTask.task_id), cpIdx)}
                      className="p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/5 hover:border-black/20 transition-all flex items-center justify-between cursor-pointer shadow-xs"
                    >
                      <span className="text-xs text-[rgb(26,26,26)] font-medium">{cp.item}</span>
                      <span 
                        className="text-[10px] font-mono px-3 py-0.5 rounded-full font-bold shadow-xs"
                        style={{
                          backgroundColor: cpStyle.bg,
                          color: cpStyle.text
                        }}
                      >
                        {cp.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Findings Summary */}
            {selectedTask.findings_summary && (
              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 space-y-1">
                <span className="text-[10px] font-mono text-[#86868b] uppercase font-semibold">Previous Inspection Notes</span>
                <p className="text-xs text-[#6e6e73] leading-relaxed font-normal">
                  {selectedTask.findings_summary}
                </p>
              </div>
            )}

            {/* Final Officer Determination Form */}
            <form onSubmit={handleSubmitDetermination} className="space-y-4 pt-4 border-t border-black/5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[rgb(26,26,26)] font-semibold">
                Submit Conclusive Determination
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDetermination('CLEARED')}
                  className={`p-2.5 rounded-full text-xs font-semibold border transition-all text-center ${
                    determination === 'CLEARED'
                      ? 'bg-[#CAFFBF] text-[#1a1a1a] border-[#b6f2aa] shadow-xs'
                      : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                  }`}
                >
                  Verify & Clear
                </button>
                <button
                  type="button"
                  onClick={() => setDetermination('MORE_DOCS')}
                  className={`p-2.5 rounded-full text-xs font-semibold border transition-all text-center ${
                    determination === 'MORE_DOCS'
                      ? 'bg-[#FDFFB6] text-[#1a1a1a] border-[#f2f59f] shadow-xs'
                      : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                  }`}
                >
                  Request Docs
                </button>
                <button
                  type="button"
                  onClick={() => setDetermination('ESCALATE')}
                  className={`p-2.5 rounded-full text-xs font-semibold border transition-all text-center ${
                    determination === 'ESCALATE'
                      ? 'bg-[#FFADAD] text-[#1a1a1a] border-[#f89393] shadow-xs'
                      : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                  }`}
                >
                  Escalate to Vigilance
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="Enter mandatory inspector observations and geo-verification remarks..."
                value={officerNote}
                onChange={(e) => setOfficerNote(e.target.value)}
                className="w-full bg-[#f5f5f7] text-[rgb(26,26,26)] border border-black/5 rounded-2xl p-3 text-xs placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[rgb(26,26,26)] text-white hover:bg-black font-semibold text-xs transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Formal Determination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
