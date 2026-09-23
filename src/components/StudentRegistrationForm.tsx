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
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      
      {/* Clean Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Fresher Party 2k26 Registration
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Fill the form below to get your official QR Entry Pass.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohan Patel"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          {/* 2. Enrollment Number & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 24CE042"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 uppercase focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Branch (Department) & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none cursor-pointer"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterOption)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none cursor-pointer"
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as GenderOption[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 rounded-lg py-2 px-2 text-xs font-medium border cursor-pointer transition-colors ${
                    gender === g
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating QR Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register & Get QR Pass</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Retrieve Existing Pass */}
        {onViewPassPrompt && (
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={onViewPassPrompt}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Search & View your QR Pass
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
