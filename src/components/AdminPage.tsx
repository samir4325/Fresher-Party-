import React, { useState } from 'react';
import { QrCode, Users, ArrowLeft, Shield } from 'lucide-react';
import { QRVerificationSystem } from './QRVerificationSystem';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';
import { StudentRegistration } from '../types';

interface AdminPageProps {
  onBackToHome: () => void;
  onViewPass: (student: StudentRegistration) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToHome,
  onViewPass,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('samir_admin_auth') === 'true';
  });

  const [adminTab, setAdminTab] = useState<'scanner' | 'students'>('scanner');
  const [scannerPassId, setScannerPassId] = useState<string | undefined>(undefined);

  // If not authenticated, require password login
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onSuccess={() => setIsAuthenticated(true)}
        onBackToHome={onBackToHome}
      />
    );
  }

  const handleOpenScannerWithPass = (passId: string) => {
    setScannerPassId(passId);
    setAdminTab('scanner');
  };

  return (
    <div className="min-h-screen bg-[#080914] text-slate-100 selection:bg-fuchsia-500 selection:text-white">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-fuchsia-500/20 bg-slate-950/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Student Registration</span>
              <span className="sm:hidden">Exit</span>
            </button>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm tracking-wide">
              <Shield className="h-4 w-4 text-fuchsia-400" />
              <span>VIP ADMIN CONSOLE</span>
            </div>
          </div>

          {/* View Switcher Pills */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setScannerPassId(undefined);
                setAdminTab('scanner');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                adminTab === 'scanner'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Gate Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('students')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                adminTab === 'students'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Student Records</span>
            </button>
          </div>

        </div>
      </header>

      {/* Admin Content */}
      <main className="py-4 sm:py-6">
        {adminTab === 'scanner' ? (
          <QRVerificationSystem initialCode={scannerPassId} />
        ) : (
          <AdminDashboard
            onViewPass={onViewPass}
            onOpenScannerWithPass={handleOpenScannerWithPass}
          />
        )}
      </main>

    </div>
  );
};
