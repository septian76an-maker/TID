import React from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, Key, Settings as SettingsIcon, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/passwords', icon: Key, label: 'Password Page' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    twMerge(
      clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
        isActive
          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-transparent dark:border-indigo-500/20 shadow-sm shadow-indigo-500/5'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
      )
    );

  return (
    <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 flex-grow-0 z-10 transition-colors">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">TID.System</span>
        </div>
        
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              <link.icon className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-transparent dark:hover:border-rose-500/20"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
