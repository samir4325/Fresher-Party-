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
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        
        <div className="text-center space-y-1">
          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <Ticket className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Find Your Entry Pass
          </h2>
          <p className="text-xs text-slate-500">
            Enter your Enrollment Number (e.g. 24CSE042) or Pass ID.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 26CE042 or FP-2k26-4812"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <span>Searching...</span> : <span>Find My Pass</span>}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          Haven't registered yet?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-indigo-600 font-semibold hover:underline cursor-pointer"
          >
            Register here
          </button>
        </div>

      </div>
    </div>
  );
};
