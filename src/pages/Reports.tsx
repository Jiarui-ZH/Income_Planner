import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart2,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import { CATEGORY_MAP } from '../utils/categories';
import {
  fmtCurrency,
  fmtMonth,
  getLastNMonths,
  getMonthKey,
} from '../utils/helpers';
import StatCard from '../components/StatCard';
import CashFlowChart from '../components/charts/CashFlowChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import SavingsRateChart from '../components/charts/SavingsRateChart';
import NetWorthChart from '../components/charts/NetWorthChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

type RangeMonths = 3 | 6 | 12;

export default function Reports() {
  const { transactions, categories, accounts } = useAppStore();
  const [range, setRange] = useState<RangeMonths>(6);

  // Merged category map
  const catMap = useMemo(() => {
    const m = { ...CATEGORY_MAP };
    for (const c of categories) m[c.id] = c;
    return m;
  }, [categories]);

  const months = useMemo(() => getLastNMonths(range), [range]);
  const startKey = months[0];

  // Transactions in range
  const rangeTxs = useMemo(
    () => transactions.filter(t => getMonthKey(t.date) >= startKey),
    [transactions, startKey]
  );

  // ── Period stats ─────────────────────────────────────────────────────────
  const totalIncome = rangeTxs
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = rangeTxs
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const avgSavingsRate =
    totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // ── Top merchants ────────────────────────────────────────────────────────
  const merchantMap: Record<string, number> = {};
  for (const t of rangeTxs) {
    if (t.amount >= 0) continue;
    const key = t.description.trim();
    merchantMap[key] = (merchantMap[key] ?? 0) + Math.abs(t.amount);
  }
  const topMerchants = Object.entries(merchantMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // ── Category totals for range ────────────────────────────────────────────
  const catTotals: Record<string, number> = {};
  for (const t of rangeTxs) {
    if (t.amount >= 0) continue;
    catTotals[t.categoryId] = (catTotals[t.categoryId] ?? 0) + Math.abs(t.amount);
  }
  const sortedCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── Monthly comparison ───────────────────────────────────────────────────
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(getMonthKey(t.date));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const [monthA, setMonthA] = useState<string>(allMonths[0] ?? '');
  const [monthB, setMonthB] = useState<string>(allMonths[1] ?? '');

  function getMonthStats(mk: string) {
    const txs = transactions.filter(t => getMonthKey(t.date) === mk);
    const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = txs
      .filter(t => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expenses;

    const cats: Record<string, number> = {};
    for (const t of txs) {
      if (t.amount >= 0) continue;
      cats[t.categoryId] = (cats[t.categoryId] ?? 0) + Math.abs(t.amount);
    }
    const top5Cats = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { income, expenses, net, top5Cats };
  }

  const statsA = useMemo(() => getMonthStats(monthA), [monthA, transactions]);
  const statsB = useMemo(() => getMonthStats(monthB), [monthB, transactions]);

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = rangeTxs.map(t => ({
      Date: t.date,
      Description: t.description,
      Amount: t.amount,
      Category: catMap[t.categoryId]?.name ?? t.categoryId,
      Account: t.accountId,
      Type: t.type,
      Tags: t.tags.join(', '),
      Notes: t.notes,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${startKey}-to-${months[months.length - 1]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Financial analytics &amp; insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range buttons */}
          <div className="flex bg-[#0d1526] border border-[#1e2d45] rounded-lg p-1 gap-1">
            {([3, 6, 12] as RangeMonths[]).map(m => (
              <button
                key={m}
                onClick={() => setRange(m)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  range === m
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={fmtCurrency(totalIncome)}
          subtitle={`Last ${range} months`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          valueColor="text-emerald-400"
        />
        <StatCard
          title="Total Expenses"
          value={fmtCurrency(totalExpenses)}
          subtitle={`Last ${range} months`}
          icon={TrendingDown}
          iconColor="text-rose-400"
          valueColor="text-rose-400"
        />
        <StatCard
          title="Net Savings"
          value={fmtCurrency(Math.abs(netSavings))}
          subtitle={netSavings >= 0 ? 'Saved' : 'Deficit'}
          icon={PiggyBank}
          iconColor={netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          valueColor={netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <StatCard
          title="Avg Savings Rate"
          value={`${avgSavingsRate.toFixed(1)}%`}
          subtitle={`Over ${range} months`}
          icon={BarChart2}
          iconColor={avgSavingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}
          valueColor={avgSavingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>

      {/* Charts grid row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Income vs Expenses
          </h2>
          <CashFlowChart transactions={rangeTxs} />
        </div>
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Category Spending
          </h2>
          <CategoryPieChart
            transactions={rangeTxs}
            categories={categories}
          />
        </div>
      </div>

      {/* Charts grid row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Savings Rate Over Time
          </h2>
          <SavingsRateChart transactions={rangeTxs} />
        </div>
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Net Worth Trend
          </h2>
          <NetWorthChart transactions={transactions} accounts={accounts} />
        </div>
      </div>

      {/* Charts grid row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Category Spending Trends
          </h2>
          <SpendingTrendChart
            transactions={rangeTxs}
            categories={categories}
            months={range}
          />
        </div>

        {/* Top categories sidebar */}
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
          <h2 className="text-sm font-semibold text-white mb-4">
            Top 5 Categories
          </h2>
          <div className="space-y-3">
            {sortedCats.map(([catId, amt]) => {
              const cat = catMap[catId];
              const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
              return (
                <div key={catId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm truncate">
                      {cat?.name ?? catId}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-slate-500 text-xs">
                        {pct.toFixed(1)}%
                      </span>
                      <span className="text-white text-sm font-medium">
                        {fmtCurrency(amt)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: cat?.color ?? '#10b981',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedCats.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">
                No expense data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top merchants table */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
        <h2 className="text-sm font-semibold text-white mb-4">
          Top Merchants / Payees
        </h2>
        {topMerchants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#1e2d45]">
                  <th className="text-slate-500 text-xs font-medium uppercase tracking-wider pb-3 pr-4">
                    #
                  </th>
                  <th className="text-slate-500 text-xs font-medium uppercase tracking-wider pb-3 flex-1">
                    Merchant / Description
                  </th>
                  <th className="text-slate-500 text-xs font-medium uppercase tracking-wider pb-3 text-right pl-4">
                    Total Spent
                  </th>
                  <th className="text-slate-500 text-xs font-medium uppercase tracking-wider pb-3 text-right pl-4">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]">
                {topMerchants.map(([merchant, amt], i) => {
                  const pct =
                    totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                  return (
                    <tr key={merchant} className="hover:bg-[#1a2744] transition-colors">
                      <td className="py-2.5 pr-4 text-slate-600 text-sm">
                        {i + 1}
                      </td>
                      <td className="py-2.5 text-white text-sm">{merchant}</td>
                      <td className="py-2.5 pl-4 text-rose-400 font-medium text-sm text-right">
                        {fmtCurrency(amt)}
                      </td>
                      <td className="py-2.5 pl-4 text-slate-400 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-[#1a2744] rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-rose-500/60 rounded-full"
                              style={{ width: `${Math.min(pct * 5, 100)}%` }}
                            />
                          </div>
                          {pct.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">
            No expense data for this period
          </p>
        )}
      </div>

      {/* Monthly Comparison */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors">
        <h2 className="text-sm font-semibold text-white mb-4">
          Monthly Comparison
        </h2>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Month A:</label>
            <select
              value={monthA}
              onChange={e => setMonthA(e.target.value)}
              className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {allMonths.map(m => (
                <option key={m} value={m}>
                  {fmtMonth(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Month B:</label>
            <select
              value={monthB}
              onChange={e => setMonthB(e.target.value)}
              className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {allMonths.map(m => (
                <option key={m} value={m}>
                  {fmtMonth(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: monthA, stats: statsA, key: 'A' },
            { label: monthB, stats: statsB, key: 'B' },
          ].map(({ label, stats, key }) => (
            <div
              key={key}
              className="bg-[#0d1e38] border border-[#1e2d45] rounded-xl p-4 space-y-4"
            >
              <h3 className="text-white font-semibold">
                {fmtMonth(label)}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-1">Income</p>
                  <p className="text-emerald-400 font-semibold text-sm">
                    {fmtCurrency(stats.income)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-1">Expenses</p>
                  <p className="text-rose-400 font-semibold text-sm">
                    {fmtCurrency(stats.expenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-1">Net</p>
                  <p
                    className={`font-semibold text-sm ${
                      stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {stats.net >= 0 ? '+' : ''}
                    {fmtCurrency(stats.net)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">
                  Top Categories
                </p>
                <div className="space-y-1.5">
                  {stats.top5Cats.map(([catId, amt]) => {
                    const cat = catMap[catId];
                    return (
                      <div key={catId} className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs truncate">
                          {cat?.name ?? catId}
                        </span>
                        <span className="text-white text-xs font-medium shrink-0 ml-2">
                          {fmtCurrency(amt)}
                        </span>
                      </div>
                    );
                  })}
                  {stats.top5Cats.length === 0 && (
                    <p className="text-slate-600 text-xs">No expenses</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Which month was better */}
        {monthA && monthB && monthA !== monthB && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            {statsA.net >= statsB.net ? (
              <>
                <ArrowUpRight size={16} className="text-emerald-400" />
                <span className="text-slate-300">
                  <span className="text-emerald-400 font-medium">
                    {fmtMonth(monthA)}
                  </span>{' '}
                  was better — net{' '}
                  <span className="text-emerald-400 font-medium">
                    {fmtCurrency(statsA.net - statsB.net)}
                  </span>{' '}
                  higher than {fmtMonth(monthB)}
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight size={16} className="text-rose-400" />
                <span className="text-slate-300">
                  <span className="text-emerald-400 font-medium">
                    {fmtMonth(monthB)}
                  </span>{' '}
                  was better — net{' '}
                  <span className="text-emerald-400 font-medium">
                    {fmtCurrency(statsB.net - statsA.net)}
                  </span>{' '}
                  higher than {fmtMonth(monthA)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
