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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Student Registration</span>
              <span className="sm:hidden">Exit</span>
            </button>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs sm:text-sm">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Admin Portal</span>
            </div>
          </div>

          {/* View Switcher Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setScannerPassId(undefined);
                setAdminTab('scanner');
              }}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                adminTab === 'scanner'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('students')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                adminTab === 'students'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Records</span>
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
