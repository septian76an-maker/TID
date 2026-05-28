import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Stats } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'stats', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as Stats);
      } else {
        setStats({ userActive: 0, deviceInstall: 0, userTrial: 0 });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stats/general');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 lg:p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] group hover:border-indigo-500/50 transition-all flex flex-col justify-center">
        <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">User Active</p>
        <h3 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white mb-6">{stats?.userActive ?? '-'}</h3>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
          <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-400/10 font-medium">+12%</span>
          <span className="text-slate-500 dark:text-slate-400">vs last month</span>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 lg:p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] group hover:border-indigo-500/50 transition-all flex flex-col justify-center">
        <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">Device Install</p>
        <h3 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white mb-6">{stats?.deviceInstall ?? '-'}</h3>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm">
          <span className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-400/10 font-medium">Total</span>
          <span className="text-slate-500 dark:text-slate-400">Verified Hardware</span>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 lg:p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] group hover:border-indigo-500/50 transition-all flex flex-col justify-center">
        <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2">User Trial</p>
        <h3 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white mb-6">{stats?.userTrial ?? '-'}</h3>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-400/10 font-medium">Active</span>
          <span className="text-slate-500 dark:text-slate-400">Trial Sessions</span>
        </div>
      </div>
    </div>
  );
}
