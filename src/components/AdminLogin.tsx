import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

const REQUIRED_ADMIN_PASSWORD = 'Samir@$2007';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToHome }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (password === REQUIRED_ADMIN_PASSWORD) {
      sessionStorage.setItem('samir_admin_auth', 'true');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      
      {/* Return to registration link */}
      <div className="absolute top-5 left-5">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="w-full max-w-xs rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-4">
        
        {error && (
          <div className="rounded-lg bg-red-950/80 border border-red-800/80 p-2 text-center text-xs text-red-300">
            Incorrect password
          </div>
        )}

        {/* Minimal Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter Password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
          >
            Login
          </button>
        </form>

      </div>

    </div>
  );
};
