import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { StoreProvider } from './store/StoreContext';
import { useAppStore } from './store/StoreContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Import from './pages/Import';
import Budget from './pages/Budget';
import Allocation from './pages/Allocation';
import Goals from './pages/Goals';
import Recurring from './pages/Recurring';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

function ThemeApplier() {
  const { settings } = useAppStore();
  useEffect(() => {
    const html = document.documentElement;
    if (settings.theme === 'light') html.classList.add('light');
    else html.classList.remove('light');
  }, [settings.theme]);
  return null;
}

function AppShell() {
  const { loading } = useAppStore();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef0f6]">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#070c1b] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/import" element={<Import />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/allocation" element={<Allocation />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Still checking session
  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef0f6]">
        <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return authView === 'login'
      ? <Login onSwitch={() => setAuthView('signup')} />
      : <Signup onSwitch={() => setAuthView('login')} />;
  }

  // Logged in
  return (
    <StoreProvider>
      <BrowserRouter>
        <ThemeApplier />
        <AppShell />
      </BrowserRouter>
    </StoreProvider>
  );
}
