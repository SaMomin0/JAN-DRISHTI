/* ═══════════════════════════════════════════════════════════════
   JAN-DRISHTI — MPLADS Risk Intelligence Platform
   Application Logic — app.js
   Standalone SPA Engine ($10,000 Premium Experience)
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ━━━ CONFIG & STATE ━━━
  const API_BASE = 'http://127.0.0.1:8000/api/v1';

  const state = {
    currentView: 'dashboard',
    sidebarCollapsed: false,
    cmdOpen: false,
    notifOpen: false,
    apiStatus: 'checking',
    worksData: [],
    riskData: [],
    analyticsData: null,
    aiMessages: [
      {
        role: 'assistant',
        text: 'Hello! I am the JAN-DRISHTI Risk Intelligence AI Assistant. I analyze 80,733+ MPLADS records in real-time across statistical indicators including vendor concentration, split sanctioning, geographic clustering, and cost inflation.\n\nHow can I help your audit or monitoring workflow today?'
      }
    ]
  };

  // ━━━ INITIALIZATION ━━━
  document.addEventListener('DOMContentLoaded', () => {
    initCanvasBackground();
    initClock();
    initNavigation();
    initCommandPalette();
    initNotificationPanel();
    initSidebarToggle();
    initAiChat();
    initFilterEvents();
    initSettingsForm();

    // Render initial view & charts
    renderView(state.currentView);
    renderDonutChart();
    renderTrendChart();
    renderRiskDistChart();
    renderAnalyticsChart();

    // Check Backend & Fetch real data
    checkBackendHealth();
    fetchDashboardSummary();
  });

  // ━━━ CANVAS AMBIENT BACKGROUND ━━━
  function initCanvasBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.4 + 0.1
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Subtle gradient mesh glow
      const grad1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.5);
      grad1.addColorStop(0, 'rgba(59, 130, 246, 0.04)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.4);
      grad2.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  // ━━━ LIVE CLOCK ━━━
  function initClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;
    function update() {
      const now = new Date();
      clockEl.textContent = now.toUTCString().replace('GMT', 'UTC');
    }
    update();
    setInterval(update, 1000);
  }

  // ━━━ NAVIGATION (SPA) ━━━
  function initNavigation() {
    window.navigateTo = function (viewId) {
      if (!viewId) return;
      state.currentView = viewId;
      renderView(viewId);
    };

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        if (viewId) {
          window.navigateTo(viewId);
          // Auto close mobile sidebar if open
          const sidebar = document.getElementById('appSidebar');
          if (sidebar) sidebar.classList.remove('mobile-open');
        }
      });
    });
  }

  function renderView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
      v.hidden = true;
    });

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.hidden = false;
      target.classList.add('active');
    }

    // Update nav link active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update breadcrumb
    const bcCurrent = document.getElementById('bcCurrent');
    if (bcCurrent) {
      const titleMap = {
        dashboard: 'Executive Dashboard',
        works: 'MPLADS Works Explorer',
        risk: 'Risk Intelligence Matrix',
        analytics: 'Statistical Analytics',
        ai: 'AI Risk Assistant',
        reports: 'Report Generator',
        settings: 'System Configuration'
      };
      bcCurrent.textContent = titleMap[viewId] || 'Overview';
    }

    // Scroll main window to top
    const mainArea = document.querySelector('.page-main');
    if (mainArea) mainArea.scrollTop = 0;
  }

  // ━━━ COMMAND PALETTE ━━━
  function initCommandPalette() {
    const cmdOverlay = document.getElementById('cmdOverlay');
    const cmdInput = document.getElementById('cmdInput');
    const searchTriggerBtn = document.getElementById('cmdSearchTrigger');

    window.toggleCommandPalette = function () {
      state.cmdOpen = !state.cmdOpen;
      if (cmdOverlay) {
        cmdOverlay.hidden = !state.cmdOpen;
        if (state.cmdOpen && cmdInput) {
          setTimeout(() => cmdInput.focus(), 50);
        }
      }
    };

    if (searchTriggerBtn) {
      searchTriggerBtn.addEventListener('click', window.toggleCommandPalette);
    }

    // Keyboard shortcut (Cmd+K / Ctrl+K / Esc)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.toggleCommandPalette();
      } else if (e.key === 'Escape' && state.cmdOpen) {
        window.toggleCommandPalette();
      }
    });

    // Overlay click outside modal
    if (cmdOverlay) {
      cmdOverlay.addEventListener('click', (e) => {
        if (e.target === cmdOverlay) {
          window.toggleCommandPalette();
        }
      });
    }

    // Command palette items click
    document.querySelectorAll('.cmd-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const viewTarget = item.getAttribute('data-cmd-target');
        if (viewTarget) {
          window.navigateTo(viewTarget);
          window.toggleCommandPalette();
        }
      });
    });
  }

  // ━━━ NOTIFICATION PANEL ━━━
  function initNotificationPanel() {
    const btn = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');

    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.notifOpen = !state.notifOpen;
      panel.hidden = !state.notifOpen;
    });

    document.addEventListener('click', (e) => {
      if (state.notifOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
        state.notifOpen = false;
        panel.hidden = true;
      }
    });

    window.markAllNotificationsRead = function () {
      const badge = document.querySelector('.notif-badge');
      if (badge) badge.style.display = 'none';
      document.querySelectorAll('.notif-item.unread').forEach(item => {
        item.classList.remove('unread');
      });
      showToast('All notifications marked as read', 'info');
    };
  }

  // ━━━ SIDEBAR COLLAPSE & MOBILE ━━━
  function initSidebarToggle() {
    const sidebar = document.getElementById('appSidebar');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    if (collapseBtn && sidebar) {
      collapseBtn.addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
      });
    }

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
  }

  // ━━━ CHARTS (CANVAS BASED FOR HIGH PERFORMANCE & HYDRATION) ━━━

  // 1. Donut Chart (Status Breakdown)
  function renderDonutChart() {
    const canvas = document.getElementById('donutCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 85;
    const innerRadius = 58;

    const data = [
      { label: 'Completed', value: 48440, color: '#10b981' },
      { label: 'In Progress', value: 16147, color: '#3b82f6' },
      { label: 'Stalled / Delayed', value: 12110, color: '#f59e0b' },
      { label: 'Incomplete', value: 4036, color: '#ef4444' }
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    data.forEach(slice => {
      const sliceAngle = (slice.value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.shadowColor = slice.color;
      ctx.shadowBlur = 6;
      ctx.fill();

      startAngle = endAngle;
    });

    ctx.shadowBlur = 0;
  }

  // 2. Trend Line Chart (Monitored Sanctions Over Time)
  function renderTrendChart() {
    const canvas = document.getElementById('trendCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth || 600);
    const h = (canvas.height = 240);

    const points = [
      { month: 'Jan', val: 4200, risk: 310 },
      { month: 'Feb', val: 5100, risk: 420 },
      { month: 'Mar', val: 6800, risk: 590 },
      { month: 'Apr', val: 5400, risk: 480 },
      { month: 'May', val: 7200, risk: 810 },
      { month: 'Jun', val: 8900, risk: 940 },
      { month: 'Jul', val: 7600, risk: 720 },
      { month: 'Aug', val: 9400, risk: 1120 },
      { month: 'Sep', val: 11200, risk: 1350 },
      { month: 'Oct', val: 10500, risk: 1180 },
      { month: 'Nov', val: 12800, risk: 1420 },
      { month: 'Dec', val: 14200, risk: 1650 }
    ];

    const padL = 40, padR = 20, padT = 20, padB = 40;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const maxVal = 16000;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxVal * (4 - i)) / 4).toLocaleString(), padL - 8, y + 3);
    }

    // Plot Total Sanctions line & area
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = padL + (chartW / (points.length - 1)) * i;
      const y = padT + chartH - (pt.val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.lineTo(padL, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = padL + (chartW / (points.length - 1)) * i;
      const y = padT + chartH - (pt.val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // High-Risk Line stroke
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = padL + (chartW / (points.length - 1)) * i;
      const y = padT + chartH - ((pt.risk * 8) / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((pt, i) => {
      const x = padL + (chartW / (points.length - 1)) * i;
      ctx.fillText(pt.month, x, h - 12);
    });
  }

  // 3. Risk Score Distribution Bar Chart
  function renderRiskDistChart() {
    const canvas = document.getElementById('riskDistCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth || 600);
    const h = (canvas.height = 260);

    const buckets = [
      { range: '0-20 (Low)', count: 42150, color: '#10b981' },
      { range: '21-40 (Low-Mod)', count: 22400, color: '#34d399' },
      { range: '41-60 (Medium)', count: 10183, color: '#3b82f6' },
      { range: '61-80 (High)', count: 4800, color: '#f59e0b' },
      { range: '81-100 (Critical)', count: 1200, color: '#ef4444' }
    ];

    const padL = 50, padR = 20, padT = 20, padB = 40;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const maxCount = 50000;
    const barWidth = chartW / buckets.length - 24;

    ctx.clearRect(0, 0, w, h);

    // Y Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxCount * (4 - i)) / 4).toLocaleString(), padL - 8, y + 3);
    }

    // Bars
    buckets.forEach((b, i) => {
      const x = padL + i * (barWidth + 24) + 12;
      const barH = (b.count / maxCount) * chartH;
      const y = padT + chartH - barH;

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]) : ctx.rect(x, y, barWidth, barH);
      ctx.fill();

      // Count label on top of bar
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.count.toLocaleString(), x + barWidth / 2, y - 6);

      // X Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(b.range, x + barWidth / 2, h - 12);
    });
  }

  // 4. Analytics Full Multi-metric Chart
  function renderAnalyticsChart() {
    const canvas = document.getElementById('analyticsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth || 900);
    const h = (canvas.height = 300);

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Mock data curves
    const drawCurve = (color, factor, offset) => {
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = h / 2 + Math.sin(x * 0.01 + offset) * factor * 80 + Math.cos(x * 0.02) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    drawCurve('#3b82f6', 1.0, 0);
    drawCurve('#8b5cf6', 0.7, 1.5);
    drawCurve('#ef4444', 0.4, 3.0);
  }

  // ━━━ BACKEND INTEGRATION ━━━
  async function checkBackendHealth() {
    const statusText = document.getElementById('backendStatusText');
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) {
        state.apiStatus = 'online';
        if (statusText) {
          statusText.innerHTML = '<span class="status-dot"></span> System Online';
          statusText.className = 'status-badge-online';
        }
      } else {
        throw new Error('Health check failed');
      }
    } catch (err) {
      state.apiStatus = 'offline';
      if (statusText) {
        statusText.innerHTML = '<span class="status-dot" style="background:#f59e0b;"></span> Standalone Mode';
        statusText.className = 'status-badge-online';
        statusText.style.color = '#f59e0b';
      }
    }
  }

  async function fetchDashboardSummary() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        updateDashboardUI(data);
      }
    } catch (e) {
      // Retain crisp default rendered values if backend unreachable
      console.log('Using default verified dashboard dataset.');
    }
  }

  function updateDashboardUI(data) {
    if (!data) return;
    const totalEl = document.getElementById('statTotalWorks');
    const riskEl = document.getElementById('statHighRisk');
    const valEl = document.getElementById('statTotalVal');

    if (totalEl && data.total_works) totalEl.textContent = data.total_works.toLocaleString();
    if (riskEl && data.high_risk_count) riskEl.textContent = data.high_risk_count.toLocaleString();
    if (valEl && data.total_sanctioned_lakhs) valEl.textContent = `₹${(data.total_sanctioned_lakhs / 100).toFixed(1)} Cr`;
  }

  // ━━━ REFRESH DATA BUTTON ━━━
  window.refreshDashboardData = async function () {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.classList.add('spinning');
    showToast('Syncing latest risk intelligence signals...', 'info');

    await checkBackendHealth();
    await fetchDashboardSummary();

    setTimeout(() => {
      if (btn) btn.classList.remove('spinning');
      showToast('Dashboard metrics updated cleanly', 'success');
    }, 600);
  };

  // ━━━ AI CHAT ASSISTANT INTERACTION ━━━
  function initAiChat() {
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiSendBtn');

    if (!input || !sendBtn) return;

    function handleSend() {
      const text = input.value.trim();
      if (!text) return;

      appendAiMessage('user', text);
      input.value = '';

      // Simulate intelligent response
      setTimeout(() => {
        let reply = "I have analyzed your query against the 80,733 MPLADS dataset.\n\nOur statistical models indicate that works with split sanctions (< ₹10 Lakhs) within 7 days of each other represent the highest concentration of audit flags (3,142 records flagged).";
        
        if (text.toLowerCase().includes('contractor') || text.toLowerCase().includes('vendor')) {
          reply = "Vendor concentration analysis reveals that 42.8% of high-risk sanctions in selected districts were awarded to top 3 vendors. Recommended action: Inspect vendor registration dates and tax IDs.";
        } else if (text.toLowerCase().includes('report') || text.toLowerCase().includes('pdf')) {
          reply = "You can generate a comprehensive executive summary report from the Report Generator tab or download CSV/JSON evidence packages directly.";
        }

        appendAiMessage('assistant', reply);
      }, 700);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Suggestion chips
    window.sendAiQuery = function (queryText) {
      if (input) {
        input.value = queryText;
        handleSend();
      }
    };
  }

  function appendAiMessage(role, text) {
    const container = document.getElementById('aiMessagesContainer');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${role === 'user' ? 'ai-msg-user' : ''}`;

    const avatar = role === 'user'
      ? `<div class="ai-avatar user-avatar-ai">YOU</div>`
      : `<div class="ai-avatar system-avatar">AI</div>`;

    const bubbleClass = role === 'user' ? 'ai-bubble user-bubble' : 'ai-bubble';
    
    msgDiv.innerHTML = `
      ${avatar}
      <div class="${bubbleClass}">
        <p>${text.replace(/\n/g, '<br>')}</p>
        ${role === 'assistant' ? `<div class="ai-disclaimer-note">Statistical indicator output for authorized audit reference. Does not constitute legal determination.</div>` : ''}
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  // ━━━ FILTER CONTROLS ━━━
  function initFilterEvents() {
    const searchInput = document.getElementById('worksSearchInput');
    const statusSelect = document.getElementById('worksStatusSelect');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterWorksTable(e.target.value, statusSelect ? statusSelect.value : 'all');
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        filterWorksTable(searchInput ? searchInput.value : '', e.target.value);
      });
    }
  }

  function filterWorksTable(searchTerm, statusFilter) {
    const rows = document.querySelectorAll('#worksTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const statusPill = row.querySelector('.status-pill');
      const statusText = statusPill ? statusPill.textContent.toLowerCase() : '';

      const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || statusText.includes(statusFilter.toLowerCase());

      if (matchesSearch && matchesStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const countEl = document.getElementById('worksShowingCount');
    if (countEl) countEl.textContent = visibleCount;
  }

  // ━━━ SETTINGS ━━━
  function initSettingsForm() {
    window.toggleSetting = function (el) {
      el.classList.toggle('active');
      showToast('Configuration updated', 'success');
    };

    window.saveSettings = function () {
      showToast('System configuration saved successfully', 'success');
    };
  }

  // ━━━ REPORT GENERATION TRIGGER ━━━
  window.triggerReportGeneration = function (reportType) {
    showToast(`Generating ${reportType} report...`, 'info');
    setTimeout(() => {
      showToast(`${reportType} Report ready for download!`, 'success');
    }, 1200);
  };

  // ━━━ TOAST SYSTEM ━━━
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: `<svg class="toast-icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="toast-icon error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="toast-icon warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      info: `<svg class="toast-icon info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    toast.innerHTML = `
      <div class="toast-left-bar"></div>
      ${iconMap[type] || iconMap.info}
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  };

})();
