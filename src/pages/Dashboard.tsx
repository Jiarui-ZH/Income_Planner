import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import { CATEGORY_MAP } from '../utils/categories';
import {
  fmtCurrency,
  fmtDate,
  fmtDateShort,
  getMonthKey,
} from '../utils/helpers';
import StatCard from '../components/StatCard';
import CashFlowChart from '../components/charts/CashFlowChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

export default function Dashboard() {
  const {
    transactions,
    categories,
    accounts,
    budgetBuckets,
    savingsGoals,
    recurringItems,
  } = useAppStore();

  const currentMonth = getMonthKey(new Date());
  const today = new Date();

  // ── Top stats ────────────────────────────────────────────────────────────
  const initialBalance = accounts.reduce((s, a) => s + a.initialBalance, 0);
  const allTxNet = transactions.reduce((s, t) => s + t.amount, 0);
  const netWorth = initialBalance + allTxNet;

  const monthTxs = transactions.filter(t => getMonthKey(t.date) === currentMonth);
  const monthIncome = monthTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0;

  // ── Budget bucket progress ───────────────────────────────────────────────
  const bucketSpend: Record<string, number> = {};
  for (const bucket of budgetBuckets) {
    const spent = monthTxs
      .filter(t => t.amount < 0 && bucket.categoryIds.includes(t.categoryId))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    bucketSpend[bucket.id] = spent;
  }

  const overBudgetBuckets = budgetBuckets.filter(
    b => (bucketSpend[b.id] ?? 0) > b.monthlyLimit
  );

  // ── Upcoming recurring (next 14 days) ───────────────────────────────────
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);

  const upcoming = recurringItems
    .filter(r => {
      if (!r.active) return false;
      const d = new Date(r.nextExpectedDate);
      return d >= today && d <= in14Days;
    })
    .sort((a, b) => a.nextExpectedDate.localeCompare(b.nextExpectedDate))
    .slice(0, 5);

  // ── Recent transactions ──────────────────────────────────────────────────
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  // Merged category map: defaults + any custom categories
  const catMap = { ...CATEGORY_MAP };
  for (const c of categories) catMap[c.id] = c;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {today.toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Alert banner */}
      {overBudgetBuckets.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-sm font-medium">Budget alert — over limit this month</p>
            <p className="text-amber-400/70 text-xs mt-0.5 truncate">
              {overBudgetBuckets
                .map(
                  b =>
                    `${b.name} (${fmtCurrency(bucketSpend[b.id] ?? 0)} / ${fmtCurrency(b.monthlyLimit)})`
                )
                .join(' · ')}
            </p>
          </div>
          <Link
            to="/budget"
            className="ml-2 text-amber-400 hover:text-amber-300 text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors shrink-0"
          >
            View budget <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={fmtCurrency(netWorth)}
          subtitle="All accounts combined"
          icon={TrendingUp}
          iconColor="text-blue-400"
          valueColor={netWorth >= 0 ? 'text-white' : 'text-rose-400'}
        />
        <StatCard
          title="Income This Month"
          value={fmtCurrency(monthIncome)}
          subtitle={currentMonth}
          icon={ArrowUpCircle}
          iconColor="text-emerald-400"
          valueColor="text-emerald-400"
        />
        <StatCard
          title="Expenses This Month"
          value={fmtCurrency(monthExpenses)}
          subtitle={currentMonth}
          icon={ArrowDownCircle}
          iconColor="text-rose-400"
          valueColor="text-rose-400"
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          subtitle="Income minus expenses"
          icon={Percent}
          iconColor={savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}
          valueColor={savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash flow — spans 2 cols */}
        <div className="lg:col-span-2 bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Cash Flow — Last 6 Months</h2>
            <span className="text-xs text-slate-500">Income · Expenses · Net</span>
          </div>
          <CashFlowChart transactions={transactions} />
        </div>

        {/* Category pie */}
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Spending This Month</h2>
            <span className="text-xs text-slate-500">by category</span>
          </div>
          <CategoryPieChart
            transactions={transactions}
            categories={categories}
            monthKey={currentMonth}
          />
        </div>
      </div>

      {/* Budget buckets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Budget Buckets
          </h2>
          <Link
            to="/budget"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...budgetBuckets]
            .sort((a, b) => a.order - b.order)
            .map(bucket => {
              const spent = bucketSpend[bucket.id] ?? 0;
              const pct =
                bucket.monthlyLimit > 0
                  ? Math.min((spent / bucket.monthlyLimit) * 100, 100)
                  : 0;
              const over = spent > bucket.monthlyLimit;
              const barColor =
                pct >= 100 ? '#f43f5e' : pct >= 80 ? '#f59e0b' : '#10b981';
              return (
                <div
                  key={bucket.id}
                  className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4 min-w-[180px] shrink-0 hover:border-[#2a3d5a] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: bucket.color + '22' }}
                    >
                      <span style={{ color: bucket.color }}>{bucket.icon}</span>
                    </div>
                    <span className="text-white text-sm font-medium truncate">
                      {bucket.name}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span
                        className={
                          over ? 'text-rose-400 font-medium' : 'text-slate-300'
                        }
                      >
                        {fmtCurrency(spent)}
                      </span>
                      <span className="text-slate-500">
                        {fmtCurrency(bucket.monthlyLimit)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{pct.toFixed(0)}% used</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Goals + Recent transactions side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goals snapshot */}
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Goals
            </h2>
            <Link
              to="/goals"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-4">
            {savingsGoals
              .filter(g => !g.completed)
              .map(goal => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min(
                        (goal.currentAmount / goal.targetAmount) * 100,
                        100
                      )
                    : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{goal.emoji}</span>
                        <span className="text-white text-sm font-medium truncate">
                          {goal.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">
                        {fmtCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fmtCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {savingsGoals.filter(g => !g.completed).length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No active goals
              </p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Recent Transactions
            </h2>
            <Link
              to="/transactions"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-0.5">
            {recent.map(tx => {
              const cat = catMap[tx.categoryId];
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a2744] transition-colors"
                >
                  <span className="text-slate-500 text-xs w-14 shrink-0">
                    {fmtDateShort(tx.date)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{tx.description}</p>
                  </div>
                  {cat && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0 hidden sm:inline"
                      style={{ background: cat.color + '22', color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium shrink-0 ${
                      tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {fmtCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming recurring */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-slate-400" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Upcoming in Next 14 Days
            </h2>
          </div>
          <Link
            to="/recurring"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {upcoming.map(item => {
              const cat = catMap[item.categoryId];
              const daysUntil = Math.ceil(
                (new Date(item.nextExpectedDate).getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={item.id}
                  className="bg-[#0d1e38] border border-[#1e2d45] rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-slate-500 shrink-0" />
                    <span className="text-white text-xs font-medium truncate">
                      {item.description}
                    </span>
                  </div>
                  {cat && (
                    <span
                      className="inline-block text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: cat.color + '22', color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.amount >= 0 ? '+' : ''}
                      {fmtCurrency(Math.abs(item.amount))}
                    </span>
                    <span className="text-xs text-slate-500">
                      {daysUntil === 0
                        ? 'Today'
                        : daysUntil === 1
                        ? 'Tomorrow'
                        : `in ${daysUntil}d`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {fmtDate(item.nextExpectedDate)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">
            No upcoming recurring items in the next 14 days
          </p>
        )}
      </div>
    </div>
  );
}
