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
    <header className="sticky top-0 z-40 w-full border-b border-fuchsia-500/20 bg-slate-950/90 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Title */}
        <div 
          onClick={() => setActiveTab('register')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 text-white font-black text-sm shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-transform">
            🎉
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                FRESHER PARTY
              </h1>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-xs">
                2K26
              </span>
            </div>
            <p className="text-[10px] font-medium text-fuchsia-300/80">VIP Event Portal</p>
          </div>
        </div>

        {/* Clean Modern Party Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>Register</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pass')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'pass'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Ticket className="h-3.5 w-3.5 text-violet-400" />
            <span>My Pass</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Gate Scanner</span>
            <span className="sm:hidden">Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
