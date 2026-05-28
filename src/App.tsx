import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PasswordPage } from './pages/PasswordPage';
import { Settings } from './pages/Settings';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/passwords': return 'Integrated Device Registry';
      case '/settings': return 'System Settings';
      default: return 'Overview';
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Navbar */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-medium text-slate-900 dark:text-white">{getPageTitle()}</h1>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{auth.currentUser?.email || 'admin@tidsystem.io'}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Master Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {auth.currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 lg:p-10 flex flex-col gap-8 flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/passwords" element={<PasswordPage />} />
            <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

