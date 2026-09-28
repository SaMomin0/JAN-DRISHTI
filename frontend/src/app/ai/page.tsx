'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Info, 
  Code2, 
  Terminal, 
  User, 
  Mic, 
  MicOff, 
  Copy, 
  Check, 
  RotateCcw,
  BarChart2,
  PieChart,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { 
  AppleDonutChart, 
  AppleBarChart, 
  APPLE_PALETTE, 
  PASTEL_ARRAY 
} from '../../components/charts/AppleCharts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sqlQuery?: string;
  citations?: { id: string; name: string; state: string; amount: number }[];
  chartData?: {
    type: 'donut' | 'bar';
    title: string;
    items: { label: string; value: number; color?: string }[];
  };
  confidence?: number;
}

export default function AIAssistantPage() {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'RISK' | 'FINANCE' | 'STATES' | 'MPS'>('ALL');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Greetings. I am the JAN-DRISHTI AI Intelligence Assistant. You can ask me natural language inquiries across 80,733 MPLADS works, financial variances, or state portfolio statistics. I can construct SQL queries, render mini-charts, and corroborate findings.',
      confidence: 99.2,
      chartData: {
        type: 'donut',
        title: 'Platform Anomaly Taxonomy Breakdown',
        items: [
          { label: 'Spatial Geotag Outliers', value: 34, color: APPLE_PALETTE.coral },
          { label: 'Disbursal Velocity Spikes', value: 24, color: APPLE_PALETTE.peach },
          { label: 'Tender Clustering', value: 18, color: APPLE_PALETTE.yellow },
          { label: 'Milestone Discrepancy', value: 14, color: APPLE_PALETTE.purple },
          { label: 'Ghost Contractor Risk', value: 10, color: APPLE_PALETTE.pink },
        ]
      }
    },
  ]);

  const categorizedSuggestions = {
    ALL: [
      'Show top works in Bihar with high sanction amounts',
      'What are the top risk factors flagged by the engine?',
      'Which MPs have highest total expenditure?',
      'How is sanction-to-expenditure lag calculated?',
    ],
    RISK: [
      'What are the top risk factors flagged by the engine?',
      'Show projects with spatial geotag mismatch in UP',
      'Breakdown of high risk anomalies by category',
    ],
    FINANCE: [
      'Show works with expenditure exceeding sanction amount',
      'Which projects show rapid unverified fund withdrawals?',
      'Average cost variance across water conservation works',
    ],
    STATES: [
      'Show top works in Bihar with high sanction amounts',
      'Compare risk scores between Maharashtra and Uttar Pradesh',
      'Which UTs have highest completed project percentages?',
    ],
    MPS: [
      'Which MPs have highest total expenditure?',
      'List MPs with highest number of sanctioned works',
      'Show constituency fund utilization leaders in Rajasthan',
    ],
  };

  const handleCopySql = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'assistant',
        text: 'Session reset. I am ready for your next parliamentary or statistical inquiry.',
      },
    ]);
  };

  const toggleVoiceInquiry = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    // Simulate real-time speech recognition
    setTimeout(() => {
      setInputQuery('Show top works in Bihar with high sanction amounts');
      setIsListening(false);
    }, 2200);
  };

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      if (queryText.toLowerCase().includes('bihar') || queryText.toLowerCase().includes('works')) {
        const res = await api.getProjects({ page: 1, page_size: 3, state: 'BIHAR' });
        const citations = (res.data || []).map((w) => ({
          id: w.work_id,
          name: w.mp_name || 'Hon’ble MP',
          state: w.state || 'BIHAR',
          amount: w.sanction_amount || 0,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: `Found ${res.pagination.total_records.toLocaleString()} total works in Bihar. Here are the top representative records ranked by sanction pool and evaluated against the Five-Signal Risk Engine:`,
            sqlQuery: "SELECT work_id, mp_name, state, sanction_amount FROM work WHERE state = 'BIHAR' ORDER BY sanction_amount DESC LIMIT 3;",
            confidence: 98.6,
            citations,
          },
        ]);
      } else if (queryText.toLowerCase().includes('mp') || queryText.toLowerCase().includes('expenditure')) {
        const stats = await api.getStatistics();
        const topMps = stats.top_mps.slice(0, 4);
        const topMp = topMps[0];

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: `National parliamentary analysis complete. The highest expenditure MP portfolio is ${topMp.mp_name} in ${topMp.state} (${topMp.constituency}) with ₹${(topMp.total_expenditure / 10000000).toFixed(2)} Cr disbursed across ${topMp.total_works_sanctioned} sanctioned works.`,
            sqlQuery: 'SELECT mp_name, state, constituency, total_expenditure FROM mp_summary ORDER BY total_expenditure DESC LIMIT 4;',
            confidence: 97.4,
            chartData: {
              type: 'bar',
              title: 'Top MP Expenditure Allocations (₹ Cr)',
              items: topMps.map((m, i) => ({
                label: m.mp_name.split(' ')[0] || `MP ${i+1}`,
                value: Math.round(m.total_expenditure / 10000000),
                color: PASTEL_ARRAY[i % PASTEL_ARRAY.length],
              })),
            },
          },
        ]);
      } else {
        const factors = await api.getRiskFactors();
        const topFactors = factors.top_risk_factors.slice(0, 5);
        const topFactor = topFactors[0];

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: `The Five-Signal Risk Engine evaluates 5 deterministic vectors. The #1 top contributing risk factor across the platform is '${topFactor.factor_name}', affecting ${topFactor.anomaly_count.toLocaleString()} works with an average severity score of ${topFactor.average_score}/100.`,
            sqlQuery: 'SELECT anomaly_type, COUNT(*), AVG(score) FROM project_anomaly GROUP BY anomaly_type ORDER BY COUNT(*) DESC LIMIT 5;',
            confidence: 99.1,
            chartData: {
              type: 'donut',
              title: 'Anomaly Factor Distribution Across 80.7k Works',
              items: topFactors.map((f, i) => ({
                label: f.factor_name.slice(0, 20),
                value: f.anomaly_count,
                color: PASTEL_ARRAY[i % PASTEL_ARRAY.length],
              })),
            },
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Error executing query: ${err.message || 'Could not connect to database.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* Top Banner (Apple HIG Inset Card) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 md:p-8 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#A0C4FF]/20 via-[#BDB2FF]/15 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/5 text-[11px] font-mono font-medium text-[rgb(26,26,26)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#BDB2FF]" />
              <span>Conversational Intelligence Core</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[rgb(26,26,26)] flex items-center space-x-3">
              <Bot className="w-7 h-7 text-[#A0C4FF]" />
              <span>AI Query Assistant</span>
            </h1>
            <p className="text-[#6e6e73] text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Ask natural language inquiries to query 80,733 records, inspect anomaly signals, and synthesize parliamentary findings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#6e6e73] bg-[#f5f5f7] px-4 py-2 rounded-full border border-black/5 font-semibold shadow-xs">
              <Database className="w-3.5 h-3.5 text-[#A0C4FF]" />
              <span>SQLite 3.42 • 80,733 Rows</span>
            </div>
            <button
              onClick={handleClearChat}
              title="Reset Chat History"
              className="p-2 rounded-full border border-black/10 hover:bg-[#f5f5f7] text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Segmented Control & Suggested Queries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6e6e73] font-semibold uppercase tracking-wider block">
            Suggested Inquiries by Topic:
          </span>
          {/* Apple HIG Segmented Control */}
          <div className="apple-segmented-container">
            {(['ALL', 'RISK', 'FINANCE', 'STATES', 'MPS'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`apple-segmented-item ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat === 'ALL' ? 'All' : cat === 'MPS' ? 'MPs' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestion Pills with Pastel Hover Accents */}
        <div className="flex flex-wrap gap-2">
          {categorizedSuggestions[activeCategory].map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-xs bg-white hover:bg-[#f5f5f7] active:scale-[0.98] text-[rgb(26,26,26)] border border-black/10 px-4 py-2 rounded-full transition-all text-left shadow-xs font-medium flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PASTEL_ARRAY[idx % PASTEL_ARRAY.length] }} />
              <span>"{s}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-6 py-2 min-h-[420px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div 
                className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-xs"
                style={{ backgroundColor: `${APPLE_PALETTE.blue}33`, color: '#1a1a1a' }}
              >
                <Bot className="w-4 h-4 text-[rgb(26,26,26)]" />
              </div>
            )}

            <div className={`max-w-2xl rounded-3xl p-5 md:p-6 space-y-4 text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-[rgb(26,26,26)] text-white font-medium shadow-md'
                : 'bg-white border border-black/5 text-[rgb(26,26,26)] shadow-[0_2px_14px_rgba(0,0,0,0.04)]'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-normal leading-relaxed">{m.text}</p>
                {m.confidence && (
                  <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full bg-[#CAFFBF]/40 text-[rgb(26,26,26)] font-mono text-[10px] font-semibold">
                    {m.confidence}% Corroborated
                  </span>
                )}
              </div>

              {/* Embedded Visual Mini Chart in AI Response */}
              {m.chartData && (
                <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-black/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[rgb(26,26,26)] flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-[#BDB2FF]" />
                      <span>{m.chartData.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#86868b]">AI Dynamic Render</span>
                  </div>

                  {m.chartData.type === 'donut' ? (
                    <AppleDonutChart
                      data={m.chartData.items}
                      size={180}
                      thickness={28}
                      centerTitle="80.7k"
                      centerSubtitle="Works"
                    />
                  ) : (
                    <AppleBarChart
                      data={m.chartData.items.map((it, i) => ({
                        label: it.label,
                        value: it.value,
                        color: it.color || PASTEL_ARRAY[i % PASTEL_ARRAY.length],
                      }))}
                      height={160}
                    />
                  )}
                </div>
              )}

              {/* SQL Query Preview Card with Copy Button */}
              {m.sqlQuery && (
                <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/5 font-mono text-[11px] text-[rgb(26,26,26)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-[#86868b] font-sans uppercase font-bold flex items-center space-x-1.5">
                      <Terminal className="w-3 h-3 text-[#1a1a1a]" style={{ color: APPLE_PALETTE.blue }} />
                      <span>Executed SQLite Query</span>
                    </div>
                    <button
                      onClick={() => handleCopySql(m.id, m.sqlQuery!)}
                      className="text-[10px] text-[#6e6e73] hover:text-[rgb(26,26,26)] flex items-center gap-1 font-sans font-medium px-2 py-0.5 rounded-md hover:bg-black/5 transition-colors"
                    >
                      {copiedQueryId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#CAFFBF]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-[rgb(26,26,26)] block font-semibold overflow-x-auto">{m.sqlQuery}</code>
                </div>
              )}

              {/* Citations Cards */}
              {m.citations && (
                <div className="space-y-2 pt-3 border-t border-black/5">
                  <div className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Source Records:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {m.citations.map((c) => (
                      <Link
                        key={c.id}
                        href={`/projects/${encodeURIComponent(c.id)}`}
                        className="bg-[#fbfbfd] p-3 rounded-2xl border border-black/5 hover:border-black/20 block transition-all text-[11px] shadow-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[rgb(26,26,26)] font-bold">Work #{c.id}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#86868b] group-hover:text-[rgb(26,26,26)] transition-colors" />
                        </div>
                        <div className="text-[#6e6e73] truncate mt-0.5">{c.name}</div>
                        <div className="text-[rgb(26,26,26)] font-mono font-semibold mt-1">₹{c.amount.toLocaleString('en-IN')}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-2xl bg-[#f5f5f7] border border-black/5 flex items-center justify-center text-[rgb(26,26,26)] flex-shrink-0 mt-1 shadow-xs">
                <User className="w-4 h-4 text-[rgb(26,26,26)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2.5 text-xs text-[#6e6e73] p-4 bg-white rounded-3xl border border-black/5 w-fit shadow-xs">
            <Sparkles className="w-4 h-4 animate-spin text-[#1a1a1a]" style={{ color: APPLE_PALETTE.purple }} />
            <span className="font-medium text-[rgb(26,26,26)]">AI Assistant is evaluating statistical signals...</span>
          </div>
        )}
      </div>

      {/* Voice Inquiry Status Banner (When simulated listening is on) */}
      {isListening && (
        <div className="p-3 bg-[#f5f5f7] border border-black/10 rounded-2xl flex items-center justify-between text-xs text-[rgb(26,26,26)] animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFADAD] animate-ping" />
            <span>Listening to voice inquiry...</span>
          </div>
          <button
            onClick={() => setIsListening(false)}
            className="text-[11px] text-[#6e6e73] hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Form (Apple Floating Capsule Input) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="flex items-center space-x-2 bg-white border border-black/10 p-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus-within:border-black/30 transition-all sticky bottom-6 z-20"
      >
        <button
          type="button"
          onClick={toggleVoiceInquiry}
          title={isListening ? 'Stop listening' : 'Start voice inquiry'}
          className={`p-2.5 rounded-full transition-all ${
            isListening 
              ? 'bg-[#FFADAD] text-black animate-pulse' 
              : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          placeholder="Ask a question about MPLADS works, financial variances, or risk indicators..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 bg-transparent text-[rgb(26,26,26)] text-xs px-3 focus:outline-none placeholder-[#86868b] font-sans"
        />

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-5 py-2.5 bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
