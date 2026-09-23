import React, { useState } from 'react';
import { Search, Ticket, AlertCircle, ArrowRight } from 'lucide-react';
import { StudentRegistration } from '../types';
import { StudentService } from '../services/studentService';

interface PassLookupProps {
  onSelectStudent: (student: StudentRegistration) => void;
  onGoToRegister: () => void;
}

export const PassLookup: React.FC<PassLookupProps> = ({
  onSelectStudent,
  onGoToRegister,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const student = await StudentService.getStudent(query.trim());
      if (student) {
        onSelectStudent(student);
      } else {
        const list = await StudentService.getStudents({ search: query.trim() });
        if (list.length > 0) {
          onSelectStudent(list[0]);
        } else {
          setError(`No registration found for "${query.trim()}". Please check your Enrollment Number or register below.`);
        }
      }
    } catch {
      setError('Could not complete lookup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <div className="relative rounded-3xl border border-fuchsia-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 p-6 sm:p-8 shadow-[0_0_40px_rgba(217,70,239,0.15)] space-y-5 text-white">
        
        <div className="text-center space-y-1">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-fuchsia-500/30">
            <Ticket className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-400 block">
            Instant Pass Retrieval
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Find Your VIP Party Pass
          </h2>
          <p className="text-xs text-slate-400">
            Enter your Enrollment Number (e.g. 26CE042) or Pass ID.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4 w-4 text-fuchsia-400" />
            </div>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 26CE042 or FP-2k26-4812"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-3 pl-10 pr-3 text-sm text-white font-mono placeholder-slate-500 uppercase focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.99] py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
          >
            {loading ? <span>Searching Pass...</span> : <span>Find My Pass →</span>}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Haven't registered yet?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-fuchsia-400 font-bold hover:underline cursor-pointer ml-1"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};
