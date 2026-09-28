'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  Database,
  Layers,
  Table,
  Sparkles
} from 'lucide-react';
import { MOCK_PROJECTS, Project } from '../../lib/mockData';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function DataUploadPage() {
  const [activeTab, setActiveTab] = useState<'BATCH' | 'MANUAL'>('BATCH');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Manual entry form state
  const [workId, setWorkId] = useState('MPLADS-UP-VAR-2026-');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads & Pathways');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Varanasi');
  const [constituency, setConstituency] = useState('Varanasi');
  const [mpName, setMpName] = useState('Shri Narendra Modi');
  const [sanctionAmount, setSanctionAmount] = useState('2500000');
  const [implementingAgency, setImplementingAgency] = useState('Public Works Department (PWD)');
  const [sanctionDate, setSanctionDate] = useState('2026-04-01');
  const [targetDate, setTargetDate] = useState('2026-10-01');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSimulateBatchUpload = () => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadSuccess(false);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadSuccess(true);
          triggerToast('Batch ingestion complete: 1,420 records validated.');
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sanctionAmount) {
      triggerToast('Please fill all mandatory project fields.');
      return;
    }

    const newProject: Project = {
      work_id: workId + Math.floor(100 + Math.random() * 900),
      title: title.trim(),
      category,
      state,
      district,
      constituency,
      mp_name: mpName,
      sanction_amount: Number(sanctionAmount),
      total_expenditure: 0,
      financial_year: '2026-27',
      sanction_date: sanctionDate,
      target_completion_date: targetDate,
      work_status: 'Sanctioned',
      risk_level: 'LOW',
      risk_score: 15,
      signals_count: 0,
      signals: [],
      coordinates: [25.3176, 82.9739],
      implementing_agency: implementingAgency,
      physical_progress_pct: 0,
      financial_progress_pct: 0
    };

    triggerToast(`Work record "${newProject.work_id}" created and queued for statistical baseline analysis.`);
    setTitle('');
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
              <span>Data Ingestion Pipeline</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <UploadCloud className="w-7 h-7 text-[#A0C4FF]" />
              <span>Data Upload & Work Registration</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Ingest official MPLADS sanction statements via bulk CSV/Excel files or register individual works for continuous risk surveillance.
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="apple-segmented-container self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('BATCH')}
              className={`apple-segmented-item flex items-center gap-1.5 ${activeTab === 'BATCH' ? 'active' : ''}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Ingestion</span>
            </button>
            <button
              onClick={() => setActiveTab('MANUAL')}
              className={`apple-segmented-item flex items-center gap-1.5 ${activeTab === 'MANUAL' ? 'active' : ''}`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Manual Work Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BATCH INGESTION */}
      {activeTab === 'BATCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Zone (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-black/5 space-y-6 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-[rgb(26,26,26)]">Upload Sanction & Expenditure File</h2>
                <p className="text-xs text-[#6e6e73]">Supported formats: CSV, XLSX, XLS. Max file size: 50 MB (up to 25,000 rows per batch).</p>
              </div>

              {/* Drag Drop Area */}
              <div 
                onClick={handleSimulateBatchUpload}
                className="p-12 border-2 border-dashed border-black/15 hover:border-black/40 rounded-3xl text-center space-y-4 cursor-pointer bg-[#fbfbfd] transition-all group shadow-xs"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs"
                  style={{ backgroundColor: `${APPLE_PALETTE.blue}33`, color: '#1a1a1a' }}
                >
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[rgb(26,26,26)] group-hover:underline underline-offset-4 transition-colors">
                    Click to browse or drop MPLADS dataset here
                  </div>
                  <p className="text-xs text-[#6e6e73] font-normal">
                    Automatic column mapping and schema validation against MoSPI portal format
                  </p>
                </div>
              </div>

              {/* Progress Bar (when uploading) */}
              {isUploading && (
                <div className="space-y-2 p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[rgb(26,26,26)] font-medium">Validating schema & calculating Z-scores...</span>
                    <span className="text-[rgb(26,26,26)] font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#eaeaed] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%`, backgroundColor: APPLE_PALETTE.blue }}
                    />
                  </div>
                </div>
              )}

              {/* Success Result */}
              {uploadSuccess && (
                <div className="p-6 rounded-3xl bg-[#fbfbfd] border border-black/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[rgb(26,26,26)] font-mono">
                    <CheckCircle2 className="w-4 h-4 text-[#1a1a1a]" style={{ color: APPLE_PALETTE.mint }} />
                    <span>DATASET INGESTION COMPLETED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-white border border-black/5 shadow-xs">
                      <div className="font-mono text-lg font-bold text-[rgb(26,26,26)]">1,420</div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">Total Rows</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-black/5 shadow-xs">
                      <div className="font-mono text-lg font-bold text-[rgb(26,26,26)]">1,396</div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">Valid Clean</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-black/5 shadow-xs">
                      <div className="font-mono text-lg font-bold text-[#1a1a1a]">24</div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">Flagged Gaps</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#6e6e73] leading-normal">
                    All clean records have been committed to SQLite database. Flagged records have been routed to the triage queue.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schema Requirements Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-black/5 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[rgb(26,26,26)] tracking-tight flex items-center gap-2">
                <Database className="w-4 h-4 text-[#A0C4FF]" />
                <span>Mandatory Schema Columns</span>
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { col: 'Work_ID', desc: 'Unique alphanumeric identifier', req: true },
                  { col: 'Work_Description', desc: 'Detailed technical scope', req: true },
                  { col: 'Sanction_Amount', desc: 'Sanctioned fund in INR (numeric)', req: true },
                  { col: 'Sanction_Date', desc: 'ISO Date (YYYY-MM-DD)', req: true },
                  { col: 'Constituency', desc: 'Lok Sabha / Rajya Sabha seat', req: true },
                  { col: 'Implementing_Agency', desc: 'PWD, RED, Municipal Body', req: true },
                  { col: 'Work_Category', desc: 'Roads, Water, Community, etc.', req: false },
                  { col: 'Latitude_Longitude', desc: 'Decimal coordinates for risk map', req: false },
                ].map(c => (
                  <div key={c.col} className="p-3 rounded-2xl bg-[#fbfbfd] border border-black/5 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-semibold text-[rgb(26,26,26)]">{c.col}</div>
                      <div className="text-[11px] text-[#86868b] mt-0.5">{c.desc}</div>
                    </div>
                    <span 
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold shadow-xs"
                      style={{
                        backgroundColor: c.req ? APPLE_PALETTE.coral : APPLE_PALETTE.sky,
                        color: '#1a1a1a'
                      }}
                    >
                      {c.req ? 'REQUIRED' : 'OPTIONAL'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-black/5">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerToast('Sample CSV template downloaded: MPLADS-Template.csv');
                  }}
                  className="text-xs text-[rgb(26,26,26)] hover:underline flex items-center justify-between font-semibold"
                >
                  <span>Download Sample CSV Template</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A0C4FF]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL WORK ENTRY */}
      {activeTab === 'MANUAL' && (
        <div className="p-8 rounded-3xl bg-white border border-black/5 max-w-4xl mx-auto space-y-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="space-y-1 border-b border-black/5 pb-4">
            <h2 className="text-lg font-semibold text-[rgb(26,26,26)]">Manual Work Registration Form</h2>
            <p className="text-xs text-[#6e6e73]">Register individual sanctioned works directly for continuous surveillance.</p>
          </div>

          <form onSubmit={handleManualFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Work ID Prefix</label>
                <input
                  type="text"
                  required
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] font-mono focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
                >
                  <option value="Roads & Pathways">Roads &amp; Pathways</option>
                  <option value="Community Infrastructure">Community Infrastructure</option>
                  <option value="Drinking Water & Sanitation">Drinking Water &amp; Sanitation</option>
                  <option value="Education & Schools">Education &amp; Schools</option>
                  <option value="Health & Family Welfare">Health &amp; Family Welfare</option>
                  <option value="Irrigation">Irrigation</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[rgb(26,26,26)]">Work Title & Detailed Technical Scope</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Construction of bituminous approach road from KM 0/0 to KM 2/4 in Chiraigaon block..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Constituency</label>
                <input
                  type="text"
                  required
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Sanction Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={sanctionAmount}
                  onChange={(e) => setSanctionAmount(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] font-mono focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Implementing Agency</label>
                <input
                  type="text"
                  required
                  value={implementingAgency}
                  onChange={(e) => setImplementingAgency(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Sanction Date</label>
                <input
                  type="date"
                  required
                  value={sanctionDate}
                  onChange={(e) => setSanctionDate(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] font-mono focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[rgb(26,26,26)]">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] font-mono focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
              <button
                type="button"
                onClick={() => setTitle('')}
                className="px-5 py-2.5 rounded-full border border-black/10 text-[#6e6e73] text-xs font-semibold hover:bg-[#f5f5f7] transition-colors"
              >
                Reset Fields
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] text-white font-semibold text-xs tracking-wider transition-all shadow-sm"
              >
                Register Work for Surveillance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
