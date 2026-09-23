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
      // Admin page opens ONLY with /samir or #samir
      const isCurrentAdmin =
        path.startsWith('/samir') || hash === '#samir' || search.includes('samir');
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

  // Normal Student Registration Portal (Clean, Simple, 100% Student Focused)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Simple Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:px-6">
          <div 
            onClick={() => setView('register')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              FP
            </div>
            <span className="font-bold text-slate-900 text-sm">
              Fresher Party 2k26
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {view === 'register' ? (
              <button
                type="button"
                onClick={() => setView('pass')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                <span>Find My Pass</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('register')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>New Registration</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Student Registration Form / Pass View */}
      <main className="flex-1 py-4">
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

      {/* Simple Clean Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>Fresher Party 2k26 · Student Registration Portal</p>
      </footer>

    </div>
  );
}
