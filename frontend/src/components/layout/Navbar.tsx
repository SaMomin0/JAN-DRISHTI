'use client';

import React from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  systemHealthy?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ systemHealthy = true }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Executive Overview', href: '/', icon: BarChart3 },
    { label: 'Work Directory', href: '/projects', icon: FolderSearch },
    { label: 'Risk Cases', href: '/risk', icon: ShieldAlert },
    { label: 'Risk Map', href: '/map', icon: Map },
    { label: 'AI Assistant', href: '/ai', icon: Bot },
    { label: 'Analysis Runs', href: '/analysis', icon: Cpu },
    { label: 'Audit Reports', href: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <>
      <CommandPalette />
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        {/* Top Banner */}
        <div className="bg-slate-950 text-gray-400 text-xs px-6 py-1.5 flex justify-between items-center border-b border-gray-800/80">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-gray-300">JAN-DRISHTI v1.0.0</span>
            <span className="text-gray-600">|</span>
            <span>Government of India • Ministry of Statistics & Program Implementation</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              {systemHealthy ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Backend Live (80,733 Works)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-medium">Connecting...</span>
                </>
              )}
            </div>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Strictly Authorized Access</span>
          </div>
        </div>

        {/* Main Nav */}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-wide block leading-none">JAN-DRISHTI</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">MPLADS Risk Intelligence</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center space-x-2 bg-slate-950 hover:bg-gray-800 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-800 text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="bg-gray-900 border border-gray-800 text-[10px] px-1.5 py-0.5 rounded text-gray-400 font-mono">⌘K</kbd>
            </button>

            <NotificationDrawer />

            <Link
              href="/settings"
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="System Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <Link
              href="/help"
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Help & Risk Glossary"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
