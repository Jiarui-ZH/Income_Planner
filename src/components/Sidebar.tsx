import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Upload, Target, PieChart,
  Bookmark, RefreshCw, BarChart2, Settings, Wallet,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/import',       icon: Upload,          label: 'Import'       },
  { to: '/budget',       icon: Target,          label: 'Budget'       },
  { to: '/allocation',   icon: PieChart,        label: 'Allocation'   },
  { to: '/goals',        icon: Bookmark,        label: 'Goals'        },
  { to: '/recurring',    icon: RefreshCw,       label: 'Recurring'    },
  { to: '/reports',      icon: BarChart2,       label: 'Reports'      },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      data-dark=""
      className={`flex flex-col bg-[#1e2535] border-r border-[#2d3748] transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      } shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#2d3748] ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="bg-[#2563eb] p-1.5 shrink-0">
          <Wallet size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-none tracking-tight">FinanceOS</p>
            <p className="text-slate-500 text-xs mt-0.5">Personal Finance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2 ${
                isActive
                  ? 'border-[#3b82f6] bg-white/8 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-0 border-l-0 border-t-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-[#60a5fa]' : 'text-slate-500'} />
                {!collapsed && <span className="font-medium">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse */}
      <div className="border-t border-[#2d3748] px-2 py-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`flex items-center gap-2 w-full px-3 py-2 text-slate-500 hover:text-white hover:bg-white/5 text-sm transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
