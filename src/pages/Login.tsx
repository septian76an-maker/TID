import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please ensure Email/Password auth is enabled in Firebase Console.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] transition-colors p-4">
      <div className="w-full max-w-md p-10 space-y-8 bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-4">
            <div className="w-6 h-6 border-[3px] border-white rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">TID.System</h1>
          <p className="text-sm text-slate-500">Access to integrated device registry</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                placeholder="admin@tidsystem.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all mt-6"
          >
            {isRegister ? 'Register' : 'Authenticate'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {isRegister ? 'Already have an account? Sign in' : 'No account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
