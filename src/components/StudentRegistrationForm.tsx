import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  StudentRegistration,
  BRANCH_OPTIONS,
  SEMESTER_OPTIONS,
  GenderOption,
  SemesterOption,
} from '../types';
import { StudentService } from '../services/studentService';

interface StudentRegistrationFormProps {
  onSuccess: (student: StudentRegistration) => void;
  onViewPassPrompt?: () => void;
}

export const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSuccess,
  onViewPassPrompt,
}) => {
  const [fullName, setFullName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [branch, setBranch] = useState<string>(BRANCH_OPTIONS[0]);
  const [semester, setSemester] = useState<SemesterOption>('Semester 1');
  const [gender, setGender] = useState<GenderOption>('Male');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!enrollmentNumber.trim()) {
      setErrorMessage('Please enter your enrollment number.');
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const student = await StudentService.registerStudent({
        fullName: fullName.trim(),
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
        mobileNumber: cleanMobile,
        department: branch,
        semester,
        gender,
        notes: '',
      });

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onSuccess(student);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      
      {/* Party Form Card */}
      <div className="relative rounded-3xl border border-fuchsia-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 p-6 sm:p-8 shadow-[0_0_40px_rgba(217,70,239,0.15)] text-white">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-fuchsia-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-violet-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="border-b border-slate-800/80 pb-4 mb-6 relative">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-400 block mb-1">
            ★ Student Entry Portal ★
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Fresher Party 2K26 Registration
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Fill your details below to generate your official digital QR party pass instantly!
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Full Name <span className="text-fuchsia-400">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohan Patel"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none"
            />
          </div>

          {/* 2. Enrollment Number & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Enrollment Number <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 24CE042"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 uppercase focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mobile Number <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Branch (Department) & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Branch <span className="text-fuchsia-400">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none cursor-pointer"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Semester <span className="text-fuchsia-400">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterOption)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none cursor-pointer"
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem} className="bg-slate-900 text-white">
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Gender <span className="text-fuchsia-400">*</span>
            </label>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as GenderOption[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 rounded-xl py-2 px-2 text-xs font-bold border cursor-pointer transition-all ${
                    gender === g
                      ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300 shadow-sm shadow-fuchsia-500/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.99] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-fuchsia-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating QR Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register & Get VIP Pass 🎉</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Retrieve Existing Pass */}
        {onViewPassPrompt && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={onViewPassPrompt}
              className="text-fuchsia-400 font-bold hover:underline cursor-pointer ml-1"
            >
              Search & View your QR Pass →
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
