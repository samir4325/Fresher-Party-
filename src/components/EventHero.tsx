import React from 'react';
import { Calendar, MapPin, Clock, Shirt, Sparkles, QrCode, UserCheck } from 'lucide-react';
import { DashboardStats } from '../types';

interface EventHeroProps {
  stats: DashboardStats | null;
  onNavigate: (tab: 'register' | 'pass' | 'scanner' | 'admin') => void;
}

export const EventHero: React.FC<EventHeroProps> = ({ stats, onNavigate }) => {
  return (
    <div className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Event Title & Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Official College Fresher Welcome 2025</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ignite The Night. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                AURA 2025 Fresher Fiesta
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Welcome to the biggest night of the academic year! Register your spot, grab your verified digital entry pass with QR code, and experience an unforgettable evening of live beats, performances, and new beginnings.
            </p>

            {/* Event Key Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-100">Oct 10, 2025</p>
                <p className="text-[11px] text-slate-400">Friday Evening</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Gates Open</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-100">5:00 PM</p>
                <p className="text-[11px] text-slate-400">Main Entry Gate 1 & 2</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-pink-400 font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Venue</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-100">Grand Arena</p>
                <p className="text-[11px] text-slate-400">Main Campus Grounds</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Shirt className="h-3.5 w-3.5" />
                  <span>Dress Code</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-100">Retro Glam</p>
                <p className="text-[11px] text-slate-400">Or Western Formal</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 hover:scale-[1.01] transition-all cursor-pointer"
              >
                <span>Register for Fresher Pass</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('pass')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <span>Find My Entry Pass</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('scanner')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-3 text-sm font-semibold text-indigo-300 hover:bg-indigo-900/50 transition-colors cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Gate Scanner</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Banner + Live Counters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <img
                src="/src/assets/images/fresher_event_banner_1790149348894.jpg"
                alt="Fresher Party Stage and Celebration Atmosphere"
                className="h-56 sm:h-64 w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-semibold tracking-wide">Live Student Counter</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Passes Active
                </span>
              </div>
            </div>

            {/* Quick Live Stats Pill Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Total Registered</span>
                <p className="mt-0.5 text-xl font-bold font-mono text-white tabular-nums">
                  {stats ? stats.totalRegistrations : '--'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-[11px] uppercase tracking-wider text-emerald-400">Approved Passes</span>
                <p className="mt-0.5 text-xl font-bold font-mono text-emerald-300 tabular-nums">
                  {stats ? stats.approvedRegistrations : '--'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-[11px] uppercase tracking-wider text-indigo-400">Verified at Gate</span>
                <p className="mt-0.5 text-xl font-bold font-mono text-indigo-300 tabular-nums">
                  {stats ? stats.verifiedEntries : '--'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
