import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Upload, Target, PieChart,
  Star, RefreshCw, BarChart2, Settings, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/import', icon: Upload, label: 'Import' },
  { to: '/budget', icon: Target, label: 'Budget' },
  { to: '/allocation', icon: PieChart, label: 'Allocation' },
  { to: '/goals', icon: Star, label: 'Goals' },
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-col bg-[#060a16] border-r border-[#1a2744] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1a2744] ${collapsed ? 'justify-center' : ''}`}>
        <div className="bg-emerald-500 rounded-lg p-1.5 shrink-0">
          <Wallet size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-none">FinanceOS</p>
            <p className="text-slate-500 text-xs mt-0.5">Personal Finance</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#111c33] border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {!collapsed && <span className="font-medium">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#111c33] text-sm transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
