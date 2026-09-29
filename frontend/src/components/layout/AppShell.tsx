'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '../ui/CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';
import { 
  ShieldAlert, 
  BarChart3, 
  FolderSearch, 
  Cpu, 
  FileSpreadsheet, 
  Map,
  Bot,
  Settings,
  HelpCircle,
  Search,
  CheckCircle2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileCheck,
  ClipboardList,
  History,
  UploadCloud,
  PieChart,
  LogOut,
  UserCheck
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // For landing page and login/sign screens, bypass dashboard AppShell wrapper
  if (pathname === '/' || pathname === '/login' || pathname === '/sign' || pathname === '/signin' || pathname === '/sign-in') {
    return <>{children}</>;
  }

  const navSections = [
    {
      heading: 'CORE OPERATIONS',
      items: [
        { label: 'Executive Dashboard', href: '/dashboard', icon: BarChart3 },
        { label: 'Work Directory', href: '/projects', icon: FolderSearch },
        { label: 'Risk Triage Overview', href: '/risk', icon: ShieldAlert },
        { label: 'Geographic Risk Map', href: '/risk-map', icon: Map },
        { label: 'Multivariate Analytics', href: '/multivariate', icon: PieChart },
      ]
    },
    {
      heading: 'INVESTIGATION & EVIDENCE',
      items: [
        { label: 'AI Query Assistant', href: '/ai', icon: Bot },
        { label: 'Evidence Management', href: '/evidence', icon: FileCheck },
        { label: 'Verification & Review', href: '/verification', icon: ClipboardList },
        { label: 'Analysis Pipeline', href: '/analysis', icon: Cpu },
      ]
    },
    {
      heading: 'GOVERNANCE & AUDIT',
      items: [
        { label: 'Audit Reports', href: '/reports', icon: FileSpreadsheet },
        { label: 'Immutable Audit Logs', href: '/audit-logs', icon: History },
        { label: 'Data Upload & Entry', href: '/data-upload', icon: UploadCloud },
        { label: 'Notifications Hub', href: '/notifications', icon: Bell },
        { label: 'System Settings', href: '/settings', icon: Settings },
        { label: 'Help & Glossary', href: '/help', icon: HelpCircle },
      ]
    }
  ];

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Executive Overview';
    if (path.startsWith('/projects/')) return 'Project Investigation Room';
    if (path === '/projects') return 'Work Directory';
    if (path.startsWith('/risk/')) return 'Risk Case Details Dossier';
    if (path === '/risk') return 'Risk Cases Overview';
    if (path === '/risk-map') return 'Geographic Risk Map';
    if (path === '/multivariate' || path === '/analytics') return 'Multivariate Risk & Portfolio Analysis';
    if (path === '/ai') return 'AI Intelligence Assistant';
    if (path === '/evidence') return 'Evidence Management Dossier';
    if (path === '/verification') return 'Verification & Review Workbench';
    if (path === '/analysis') return 'Statistical Analysis Pipeline';
    if (path === '/reports') return 'Audit Reports Studio';
    if (path === '/audit-logs') return 'Immutable Audit Logs';
    if (path === '/data-upload') return 'Data Ingestion & Manual Entry';
    if (path === '/notifications') return 'Notifications Hub';
    if (path === '/settings') return 'System Configuration & Thresholds';
    if (path === '/help') return 'Documentation & Help Manual';
    return 'JAN-DRISHTI';
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[rgb(26,26,26)] flex flex-col font-sans selection:bg-[#BDB2FF]/30 selection:text-black">
      <CommandPalette />

      {/* Apple Status Bar */}
      <div className="bg-[#fbfbfd] text-[#6e6e73] text-[11px] px-6 py-2 flex justify-between items-center border-b border-black/5 z-50">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CAFFBF] border border-black/20" />
          <span className="font-semibold text-[rgb(26,26,26)] tracking-wide">JAN-DRISHTI v2.4</span>
          <span className="text-neutral-300">|</span>
          <span className="hidden sm:inline text-[#6e6e73]">Ministry of Statistics &amp; Programme Implementation (MoSPI)</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[rgb(26,26,26)]" />
            <span className="text-[rgb(26,26,26)] font-semibold">80,733 Works Active</span>
          </div>
          <span className="text-neutral-300">|</span>
          <Link href="/login" className="text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-colors flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[rgb(26,26,26)]" />
            <span className="font-mono text-[10px] uppercase font-semibold">Officer Portal</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar (Apple HIG Clean) */}
        <aside
          className={`hidden md:flex flex-col border-r border-black/5 bg-[#ffffff] transition-all duration-200 z-30 ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Logo Branding */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-black/5">
            <Link href="/" className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-2xl bg-[rgb(26,26,26)] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <span className="text-base font-bold text-[rgb(26,26,26)] tracking-tight block leading-none">JAN-DRISHTI</span>
                  <span className="text-[10px] text-[#86868b] font-mono tracking-widest uppercase">Risk Intelligence</span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-[#86868b] hover:text-[rgb(26,26,26)] rounded-full hover:bg-neutral-100 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#86868b] font-semibold mb-1.5">
                    {section.heading}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-2xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[rgb(26,26,26)] text-white font-semibold shadow-xs'
                          : 'text-[#6e6e73] hover:text-[rgb(26,26,26)] hover:bg-[#f5f5f7]'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#86868b] group-hover:text-[rgb(26,26,26)]'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer with Responsible AI Note */}
          {!collapsed && (
            <div className="p-4 border-t border-black/5 bg-[#fbfbfd] text-[11px] text-[#6e6e73] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[rgb(26,26,26)]">Responsible AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CAFFBF] text-[rgb(26,26,26)] font-mono font-semibold">HUMAN-IN-LOOP</span>
              </div>
              <p className="text-[10px] text-[#86868b] leading-tight">Statistical indicators highlight patterns for authorized human verification.</p>
              <Link
                href="/login"
                className="flex items-center space-x-2 text-[#6e6e73] hover:text-[rgb(26,26,26)] text-xs pt-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch / Sign Out</span>
              </Link>
            </div>
          )}
        </aside>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md md:hidden flex">
            <div className="w-72 bg-white border-r border-black/10 h-full flex flex-col p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-6 h-6 text-[rgb(26,26,26)]" />
                  <span className="font-bold text-[rgb(26,26,26)] text-base">JAN-DRISHTI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-[#6e6e73] hover:text-[rgb(26,26,26)]" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-3 overflow-y-auto">
                {navSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#86868b] font-bold mb-1">
                      {section.heading}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-2xl text-xs font-semibold ${
                            isActive ? 'bg-[rgb(26,26,26)] text-white' : 'text-[#6e6e73] hover:bg-neutral-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#fbfbfd]">
          {/* Top Apple Navigation Bar */}
          <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur-xl border-b border-black/5 px-6 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-[#6e6e73] hover:text-[rgb(26,26,26)] rounded-lg hover:bg-neutral-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="text-[10px] text-[#86868b] uppercase tracking-widest font-mono font-semibold">
                  JAN-DRISHTI • {getPageTitle(pathname)}
                </div>
                <h1 className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight leading-tight">
                  {getPageTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                  window.dispatchEvent(event);
                }}
                className="flex items-center space-x-2 bg-[#f0f0f3] hover:bg-[#e4e4e7] text-[#6e6e73] hover:text-[rgb(26,26,26)] px-3.5 py-1.5 rounded-full border border-black/5 text-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[rgb(26,26,26)]" />
                <span className="hidden sm:inline">Search records...</span>
                <kbd className="bg-white border border-black/10 text-[10px] px-1.5 py-0.5 rounded text-[#6e6e73] font-mono shadow-2xs">⌘K</kbd>
              </button>

              <NotificationDrawer />

              <Link
                href="/settings"
                className="p-2 text-[#6e6e73] hover:text-[rgb(26,26,26)] rounded-full hover:bg-neutral-100 transition-colors"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 pl-3 border-l border-black/5 text-xs text-[#6e6e73] hover:text-[rgb(26,26,26)]"
              >
                <div className="w-7 h-7 rounded-full bg-[rgb(26,26,26)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AK
                </div>
                <div className="text-left text-[11px] leading-none hidden lg:block">
                  <div className="font-semibold text-[rgb(26,26,26)]">Shri A. K. Sharma</div>
                  <div className="text-[#86868b] text-[9px]">District Collector</div>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Body View */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-black/5 bg-[#ffffff] py-6 text-center text-xs text-[#86868b]">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div>© 2026 JAN-DRISHTI • Ministry of Statistics &amp; Programme Implementation (MoSPI)</div>
              <div className="text-[#6e6e73] font-medium text-[11px]">
                A Signal Is Not a Verdict. Evidence-Linked Risk Intelligence for MPLADS.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
