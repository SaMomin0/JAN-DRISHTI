'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  ArrowLeft, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Layers, 
  History, 
  Download, 
  CheckSquare, 
  HelpCircle, 
  ExternalLink,
  Plus,
  Send,
  X
} from 'lucide-react';
import { MOCK_RISK_CASES, RiskCase } from '../../../lib/mockData';

export default function RiskCaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params?.id as string) || 'RC-2026-0842';

  // Find matching case or construct safe fallback
  const rawFound = MOCK_RISK_CASES.find(c => c.case_id === caseId || c.work_id === caseId || caseId.includes(c.work_id));
  const currentCase: RiskCase = rawFound || {
    ...MOCK_RISK_CASES[0],
    case_id: caseId,
    work_id: caseId.replace('CASE-', ''),
    title: `Investigation Dossier for Work ${caseId}`,
    dossier: {
      ...MOCK_RISK_CASES[0].dossier,
      project_summary: `Statistical outlier analysis flagged for MPLADS Scheme ${caseId}. Field verification recommended prior to fund sanction release.`,
    }
  };

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SIGNALS' | 'EVIDENCE' | 'PEERS' | 'CHECKLIST' | 'AUDIT'>('OVERVIEW');
  const [caseStatus, setCaseStatus] = useState<RiskCase['status']>(currentCase.status || 'Under Verification');
  const [checklist, setChecklist] = useState(currentCase.dossier?.verification_checklist || MOCK_RISK_CASES[0].dossier.verification_checklist);
  const [actionHistory, setActionHistory] = useState(currentCase.dossier?.officer_action_history || MOCK_RISK_CASES[0].dossier.officer_action_history);
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleToggleChecklist = (index: number) => {
    const updated = [...checklist];
    updated[index].verified = !updated[index].verified;
    setChecklist(updated);
    triggerToast(`Checkpoint "${updated[index].checkpoint.slice(0, 24)}..." updated.`);
  };

  const handleAddOfficerNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newAction = {
      date: new Date().toISOString().split('T')[0],
      officer: 'Shri A. K. Sharma (District Collector)',
      action: 'Verification Note Logged',
      note: newNote.trim()
    };

    setActionHistory([newAction, ...actionHistory]);
    setNewNote('');
    setShowNoteModal(false);
    triggerToast('Verification note recorded to immutable audit log.');
  };

  const handleStatusChange = (newStat: RiskCase['status']) => {
    setCaseStatus(newStat);
    const logItem = {
      date: new Date().toISOString().split('T')[0],
      officer: 'Shri A. K. Sharma (District Collector)',
      action: `Status Changed to "${newStat}"`,
      note: `Officer transitioned dossier status.`
    };
    setActionHistory([logItem, ...actionHistory]);
    triggerToast(`Case status updated to "${newStat}".`);
  };

  const handleExportDossier = () => {
    triggerToast('Generating encrypted parliamentary evidence dossier (PDF)...');
    setTimeout(() => {
      triggerToast('Evidence Dossier RC-2026-0842-Dossier.pdf exported.');
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-white text-black font-semibold text-xs shadow-2xl flex items-center gap-2 border border-black/10 animate-fade-in backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/risk" className="hover:text-white transition-colors">Risk Cases</Link>
          <span>/</span>
          <span className="text-white font-medium">{currentCase.case_id}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportDossier}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white border border-white/10 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export PDF Dossier</span>
          </button>
          <Link
            href={`/projects/${currentCase.work_id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-[0.98] text-xs font-semibold transition-all shadow-sm"
          >
            <span>Project Room</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-mono font-medium">
                {currentCase.case_id}
              </span>
              <span className="text-xs font-mono text-neutral-400 bg-black px-3 py-1 rounded-full border border-white/10">
                Work ID: {currentCase.work_id}
              </span>
              <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-mono font-bold">
                {currentCase.severity} RISK ({currentCase.risk_score}/100)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
              {currentCase.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <span><strong className="text-neutral-300">Constituency:</strong> {currentCase.constituency}</span>
              <span>•</span>
              <span><strong className="text-neutral-300">District:</strong> {currentCase.district}, {currentCase.state}</span>
              <span>•</span>
              <span><strong className="text-neutral-300">Assigned Officer:</strong> {currentCase.assigned_officer}</span>
            </div>
          </div>

          {/* Status Dropdown Box */}
          <div className="p-5 rounded-2xl bg-black border border-white/10 space-y-2 lg:min-w-[260px]">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
              Case Verification Stage
            </label>
            <select
              value={caseStatus}
              onChange={(e) => handleStatusChange(e.target.value as RiskCase['status'])}
              className="w-full bg-[#111111] border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-white cursor-pointer transition-colors"
            >
              <option value="Open">Open (Pending Triage)</option>
              <option value="Under Verification">Under Verification (Site Inspection)</option>
              <option value="Pending Counter-Evidence">Pending Counter-Evidence</option>
              <option value="Verified - Cleared">Verified - Cleared (Asset Corroborated)</option>
              <option value="Escalated">Escalated to Ministry Apex</option>
            </select>
            <div className="text-[11px] text-neutral-500 font-sans">
              Status changes logged to audit trail.
            </div>
          </div>
        </div>

        {/* Apple Segmented Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          {[
            { id: 'OVERVIEW', label: '8-Pillar Overview', icon: Layers },
            { id: 'CHECKLIST', label: 'Field Checklist', icon: CheckSquare },
            { id: 'PEERS', label: 'Peer Baselines', icon: Building2 },
            { id: 'AUDIT', label: 'Action History', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Dossier Summary */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                1. Project Narrative & Core Anomaly
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                {currentCase.dossier?.project_summary || 'Verification recommended based on statistical risk signals.'}
              </p>
            </div>

            {/* Pillar Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Observed Deviations</span>
                </div>
                <ul className="space-y-2 text-xs text-neutral-300">
                  {(currentCase.dossier?.detected_signals || []).map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-white font-bold">•</span>
                      <span><strong className="text-white">{s.title}:</strong> {s.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <HelpCircle className="w-4 h-4 text-white" />
                  <span>Data Limitations & Gaps</span>
                </div>
                <ul className="space-y-2 text-xs text-neutral-300">
                  {(currentCase.dossier?.data_limitations || []).map((l, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-white font-bold">•</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Counter Evidence */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-4">
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center justify-between">
                <span>Counter-Evidence & Context</span>
                <span className="text-[11px] font-mono text-neutral-400">Fair Review</span>
              </h3>
              <div className="space-y-3">
                {(currentCase.dossier?.counter_evidence || []).map((ce, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-black border border-white/10 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-400">{ce.source}</span>
                      <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white font-semibold">
                        {ce.validity}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-normal">{ce.claim}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CHECKLIST' && (
        <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Physical Verification Audit Checklist</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Conduct on-site inspection of construction assets and verify billing claims.</p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white">
              {checklist.filter(c => c.verified).length} / {checklist.length} Completed
            </span>
          </div>

          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleToggleChecklist(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  item.verified
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-black/60 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  item.verified ? 'bg-white border-white text-black' : 'border-white/30'
                }`}>
                  {item.verified && <CheckCircle2 className="w-4 h-4 text-black" />}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-white">
                    {item.checkpoint}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Notes: {item.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PEERS' && (
        <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-semibold text-white">Comparable Peer Works</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Peer baseline group matched against identical civil specs in adjacent districts.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 font-mono border-b border-white/10 pb-2">
                <tr>
                  <th className="p-3">Work ID</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Sanction Amount</th>
                  <th className="p-3">Cost Variance vs Target</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(currentCase.dossier?.comparable_peers || []).map(p => (
                  <tr key={p.work_id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono font-medium text-white">{p.work_id}</td>
                    <td className="p-3 text-neutral-300">{p.location}</td>
                    <td className="p-3 font-mono font-medium text-white">₹{(p.amount / 100000).toFixed(2)} Lakhs</td>
                    <td className="p-3 font-mono text-neutral-300">{p.variance}</td>
                    <td className="p-3">
                      <Link href={`/projects/${p.work_id}`} className="text-xs text-white hover:underline underline-offset-4">
                        Compare Specs
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 border-t-white/20 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Auditable Officer Action Log</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Chronological immutable record of decisions, field inspections, and status overrides.</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-[0.98] text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Officer Note</span>
            </button>
          </div>

          <div className="space-y-3">
            {actionHistory.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-black border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{item.action}</span>
                  <span className="font-mono text-[10px] text-neutral-500">{item.date}</span>
                </div>
                <div className="text-xs text-neutral-300 font-normal">{item.note}</div>
                <div className="text-[10px] font-mono text-neutral-500">By: {item.officer}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Officer Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/15 border-t-white/25 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Record Verification Finding</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-400">This entry will be permanently appended to the tamper-evident audit history.</p>

            <form onSubmit={handleAddOfficerNote} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Enter field observations, vendor discrepancies, or foundation audit notes..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white transition-colors"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-full border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-[0.98] text-xs font-semibold transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Append to Audit Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
