'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileCheck, 
  Search, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  FileSpreadsheet, 
  X, 
  Plus,
  Sparkles
} from 'lucide-react';
import { MOCK_EVIDENCE_ITEMS, EvidenceItem } from '../../lib/mockData';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(MOCK_EVIDENCE_ITEMS);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<EvidenceItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form states for upload
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadWorkId, setUploadWorkId] = useState('MPLADS-UP-VAR-2024-001');
  const [uploadCat, setUploadCat] = useState<EvidenceItem['category']>('Field Report');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredItems = evidenceList.filter(item => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.doc_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.work_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sha256_hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const newItem: EvidenceItem = {
      id: `EVD-${Math.floor(100 + Math.random() * 900)}`,
      work_id: uploadWorkId,
      doc_title: uploadTitle.trim(),
      category: uploadCat,
      uploaded_by: 'Current Field Auditor (Purvanchal)',
      upload_date: new Date().toISOString().split('T')[0],
      file_size: '3.2 MB',
      file_type: 'PDF',
      verification_status: 'VERIFIED',
      sha256_hash: 'a7c93849102847291aeb82930281923049102938472910293847291029384729'
    };

    setEvidenceList([newItem, ...evidenceList]);
    setUploadTitle('');
    setShowUploadModal(false);
    triggerToast(`Document "${newItem.doc_title.slice(0, 24)}..." securely registered.`);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Geotagged Photo':
        return APPLE_PALETTE.sky;
      case 'Expenditure Voucher':
        return APPLE_PALETTE.yellow;
      case 'Completion Certificate':
        return APPLE_PALETTE.mint;
      case 'Sanction Order':
        return APPLE_PALETTE.blue;
      case 'Field Report':
      default:
        return APPLE_PALETTE.purple;
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
              <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
              <span>Cryptographic Proof Vault</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <FileCheck className="w-7 h-7 text-[#BDB2FF]" />
              <span>Evidence Management Dossier</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Immutable repository of sanction orders, expenditure vouchers, geotagged satellite imagery, and field inspection reports.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgb(26,26,26)] text-white hover:bg-black active:scale-[0.98] font-semibold text-xs transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Evidence Record</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar (Apple Segmented Toolbar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-black/5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'Sanction Order', 'Expenditure Voucher', 'Completion Certificate', 'Geotagged Photo', 'Field Report'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-[rgb(26,26,26)] text-white shadow-sm'
                  : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
              }`}
            >
              {cat === 'ALL' ? 'All Documents' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, work ID, or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f5f5f7] border border-black/5 rounded-full pl-9 pr-4 py-2 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
          />
        </div>
      </div>

      {/* Evidence Grid Cards (Apple Inset Cards with Pastel Color coding) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const catColor = getCategoryColor(item.category);

          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white border border-black/5 hover:border-black/20 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[rgb(26,26,26)] font-semibold bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/5 text-[11px]">
                    {item.id}
                  </span>
                  <span 
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-xs"
                    style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
                  >
                    <ShieldCheck className="w-3 h-3 text-[#1a1a1a]" />
                    <span>{item.verification_status}</span>
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: `${catColor}33`, color: '#1a1a1a' }}
                  >
                    {item.category === 'Geotagged Photo' ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : item.category === 'Expenditure Voucher' ? (
                      <FileSpreadsheet className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[rgb(26,26,26)] transition-colors line-clamp-2 leading-snug">
                      {item.doc_title}
                    </h3>
                    <div className="text-[11px] font-mono text-[#86868b]">
                      Linked: <Link href={`/projects/${item.work_id}`} className="text-[rgb(26,26,26)] font-medium hover:underline underline-offset-4">{item.work_id}</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 space-y-2 text-[11px] text-[#6e6e73]">
                <div className="flex justify-between">
                  <span className="font-medium text-[rgb(26,26,26)]">{item.category}</span>
                  <span className="font-mono text-[#86868b]">{item.file_size} • {item.file_type}</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#86868b]">
                  <span className="truncate">Hash: {item.sha256_hash.slice(0, 16)}...</span>
                  <span>{item.upload_date}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedDoc(item)}
                    className="flex-1 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#eaeaed] text-[rgb(26,26,26)] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Record</span>
                  </button>
                  <button
                    onClick={() => triggerToast(`Downloading verified file ${item.doc_title.slice(0, 18)}...`)}
                    className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#eaeaed] text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-colors shadow-xs"
                    title="Download Evidence"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Document Modal (Apple Sheet) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-black/10 p-6 space-y-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#86868b] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${getCategoryColor(selectedDoc.category)}33`, color: '#1a1a1a' }}
              >
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#86868b] font-semibold">VERIFIED EVIDENCE RECORD</span>
                <h3 className="text-base font-semibold text-[rgb(26,26,26)]">{selectedDoc.doc_title}</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/5 space-y-1">
                <div className="text-[10px] font-mono text-[#86868b] uppercase font-semibold">Cryptographic SHA-256 Hash</div>
                <div className="font-mono text-xs text-[rgb(26,26,26)] break-all font-medium">{selectedDoc.sha256_hash}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[#6e6e73]">
                <div className="p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
                  <div className="text-[10px] text-[#86868b] font-medium">Linked Project</div>
                  <div className="font-mono font-semibold text-[rgb(26,26,26)]">{selectedDoc.work_id}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
                  <div className="text-[10px] text-[#86868b] font-medium">Specifications</div>
                  <div className="font-mono font-semibold text-[rgb(26,26,26)]">{selectedDoc.file_size} • {selectedDoc.file_type}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
                  <div className="text-[10px] text-[#86868b] font-medium">Uploaded By</div>
                  <div className="font-medium text-[rgb(26,26,26)]">{selectedDoc.uploaded_by}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1">
                  <div className="text-[10px] text-[#86868b] font-medium">Upload Date</div>
                  <div className="font-mono font-semibold text-[rgb(26,26,26)]">{selectedDoc.upload_date}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/5">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-full border border-black/10 text-[#6e6e73] text-xs font-semibold hover:bg-[#f5f5f7] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  triggerToast(`Downloading ${selectedDoc.doc_title}...`);
                  setSelectedDoc(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[rgb(26,26,26)] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Secure Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (Apple Sheet) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-black/10 p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="text-base font-semibold text-[rgb(26,26,26)]">Upload Corroborating Evidence</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full text-[#86868b] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6e6e73]">Attach sanction letters, GPS geotag photos, or soil inspection lab test sheets.</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[rgb(26,26,26)] font-semibold">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geotechnical Bearing Test Report #Geo-44"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[rgb(26,26,26)] font-semibold">Linked Work ID</label>
                  <input
                    type="text"
                    required
                    value={uploadWorkId}
                    onChange={(e) => setUploadWorkId(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] font-mono focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[rgb(26,26,26)] font-semibold">Category</label>
                  <select
                    value={uploadCat}
                    onChange={(e) => setUploadCat(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-3 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
                  >
                    <option value="Sanction Order">Sanction Order</option>
                    <option value="Expenditure Voucher">Expenditure Voucher</option>
                    <option value="Completion Certificate">Completion Certificate</option>
                    <option value="Geotagged Photo">Geotagged Photo</option>
                    <option value="Field Report">Field Report</option>
                  </select>
                </div>
              </div>

              {/* Drag drop simulation */}
              <div className="p-8 border-2 border-dashed border-black/10 hover:border-black/30 rounded-2xl text-center space-y-2 cursor-pointer bg-[#fbfbfd] transition-all">
                <UploadCloud className="w-8 h-8 text-[rgb(26,26,26)] mx-auto opacity-70" />
                <div className="text-xs text-[rgb(26,26,26)] font-semibold">Click to select or drag PDF, JPG, PNG, or XLSX</div>
                <div className="text-[10px] text-[#86868b] font-mono">Max size 25 MB per document • Automatic SHA-256 hash calculation</div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-full border border-black/10 text-[#6e6e73] text-xs font-semibold hover:bg-[#f5f5f7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[rgb(26,26,26)] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm"
                >
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
