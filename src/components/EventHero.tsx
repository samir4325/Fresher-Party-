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
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
              <Sparkles className="h-4 w-4 text-fuchsia-400 animate-pulse" />
              <span>★ Official Fresher Party 2K26 ★</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
              GLOW & CELEBRATE. <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
                FRESHER FIESTA 2K26
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Step into the most electrifying night of your college life! Register your entry pass, get your exclusive verified digital QR pass, and celebrate with DJ beats, live performances, and unforgettable memories!
            </p>

            {/* Event Key Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl border border-fuchsia-500/30 bg-slate-900/80 p-3.5 shadow-lg shadow-fuchsia-500/5">
                <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 font-bold">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">27/09/2026</p>
                <p className="text-[11px] text-fuchsia-300/80 font-medium">Party Night</p>
              </div>

              <div className="rounded-2xl border border-violet-500/30 bg-slate-900/80 p-3.5 shadow-lg shadow-violet-500/5">
                <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Entry Access</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">VIP QR Pass</p>
                <p className="text-[11px] text-violet-300/80 font-medium">Express Gate Scan</p>
              </div>

              <div className="rounded-2xl border border-pink-500/30 bg-slate-900/80 p-3.5 shadow-lg shadow-pink-500/5">
                <div className="flex items-center gap-1.5 text-xs text-pink-400 font-bold">
                  <MapPin className="h-4 w-4" />
                  <span>Venue</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">Grand Arena</p>
                <p className="text-[11px] text-pink-300/80 font-medium">Campus Grounds</p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-3.5 shadow-lg shadow-amber-500/5">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                  <Shirt className="h-4 w-4" />
                  <span>Dress Code</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">Party / Glam</p>
                <p className="text-[11px] text-amber-300/80 font-medium">Dress to Impress</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-fuchsia-500/30 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Get Fresher Pass 🎉</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('pass')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-500/40 bg-slate-900/90 px-5 py-3.5 text-sm font-bold text-fuchsia-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <span>Find My Pass</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('scanner')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-900/50 transition-colors cursor-pointer"
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
