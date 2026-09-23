import React from 'react';
import { UserPlus, Ticket, QrCode, Shield } from 'lucide-react';

interface NavbarProps {
  activeTab: 'register' | 'pass' | 'scanner' | 'admin';
  setActiveTab: (tab: 'register' | 'pass' | 'scanner' | 'admin') => void;
  verifiedCount?: number;
  totalCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Title */}
        <div 
          onClick={() => setActiveTab('register')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
            FP
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Fresher Party 2025
            </h1>
            <p className="text-[10px] text-slate-500">Student Entry Portal</p>
          </div>
        </div>

        {/* Clean Minimal Navigation */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Registration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pass')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'pass'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>My Pass</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gate Scanner</span>
            <span className="sm:hidden">Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
