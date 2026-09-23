/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentRegistrationForm } from './components/StudentRegistrationForm';
import { DigitalEntryPass } from './components/DigitalEntryPass';
import { PassLookup } from './components/PassLookup';
import { AdminPage } from './components/AdminPage';
import { StudentRegistration } from './types';
import { Ticket, UserPlus } from 'lucide-react';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'register' | 'pass'>('register');
  const [currentStudent, setCurrentStudent] = useState<StudentRegistration | null>(null);

  // Check URL path/hash on load and listen to browser navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      // Admin page opens with /admin, /samir, #admin, or #samir
      const isCurrentAdmin =
        path.startsWith('/admin') ||
        path.startsWith('/samir') ||
        hash === '#admin' ||
        hash === '#samir' ||
        search.includes('admin') ||
        search.includes('samir');
      setIsAdmin(isCurrentAdmin);
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsAdmin(false);
    setView('register');
  };

  const handleRegistrationSuccess = (student: StudentRegistration) => {
    setCurrentStudent(student);
    setView('pass');
  };

  // If URL is /samir, show Admin Page
  if (isAdmin) {
    return (
      <AdminPage
        onBackToHome={navigateToHome}
        onViewPass={(student) => {
          setCurrentStudent(student);
          setView('pass');
          navigateToHome();
        }}
      />
    );
  }

  // Normal Student Registration Portal (Full Party Glow Aesthetic)
  return (
    <div className="min-h-screen flex flex-col bg-[#080914] text-slate-100 selection:bg-fuchsia-500 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Ambient Neon Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/15 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] right-[15%] w-[30vw] h-[30vw] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />

      {/* Modern Party Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-fuchsia-500/20 bg-slate-950/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <div 
            onClick={() => setView('register')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 text-white font-black text-sm shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-transform">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm sm:text-base tracking-wide">
                  FRESHER PARTY
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-xs">
                  2K26
                </span>
              </div>
              <p className="text-[10px] text-fuchsia-300/70 font-medium">Official Entry Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'register' ? (
              <button
                type="button"
                onClick={() => setView('pass')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/30 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-fuchsia-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-sm shadow-fuchsia-500/10"
              >
                <Ticket className="h-3.5 w-3.5 text-fuchsia-400" />
                <span>Find My Pass</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('register')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition-all cursor-pointer shadow-md shadow-fuchsia-500/25"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Student Registration Form / Pass View */}
      <main className="flex-1 py-6 relative z-10">
        {view === 'register' && (
          <StudentRegistrationForm
            onSuccess={handleRegistrationSuccess}
            onViewPassPrompt={() => setView('pass')}
          />
        )}

        {view === 'pass' && (
          currentStudent ? (
            <DigitalEntryPass
              student={currentStudent}
              onBack={() => setView('register')}
            />
          ) : (
            <PassLookup
              onSelectStudent={(student) => {
                setCurrentStudent(student);
              }}
              onGoToRegister={() => setView('register')}
            />
          )
        )}
      </main>

      {/* Party Footer */}
      <footer className="no-print mt-auto border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-500 relative z-10">
        <p className="font-semibold text-slate-400">✨ Fresher Party 2K26 · Official Event Portal ✨</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Date: 27/09/2026 · Laduma banquet hall</p>
      </footer>

    </div>
  );
}
