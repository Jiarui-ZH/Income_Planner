import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

// Applies/removes the .light class on <html> based on persisted theme setting
function ThemeApplier() {
  const { settings } = useAppStore();
  useEffect(() => {
    const html = document.documentElement;
    if (settings.theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  }, [settings.theme]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ThemeApplier />
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
      </BrowserRouter>
    </StoreProvider>
  );
}
