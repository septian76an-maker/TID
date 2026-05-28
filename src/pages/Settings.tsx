import React from 'react';
import { Moon, Sun } from 'lucide-react';

export function Settings({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) {
  return (
    <div className="flex-1 space-y-6">
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 max-w-2xl transition-colors shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <h2 className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-6">
          Theme Preferences
        </h2>
        
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              theme === 'light' 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Sun className="w-8 h-8" />
            <span className="font-semibold text-sm">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              theme === 'dark' 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Moon className="w-8 h-8" />
            <span className="font-semibold text-sm">Dark Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
