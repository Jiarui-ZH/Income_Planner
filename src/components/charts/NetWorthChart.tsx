import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Transaction, Account } from '../../types';
import { getMonthKey, fmtCurrency, fmtMonth } from '../../utils/helpers';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
}

export default function NetWorthChart({ transactions, accounts }: Props) {
  const initialBalance = accounts.reduce((s, a) => s + a.initialBalance, 0);

  // Collect all months that appear in transactions, sorted
  const monthSet = new Set<string>();
  for (const t of transactions) monthSet.add(getMonthKey(t.date));
  const months = Array.from(monthSet).sort();

  if (months.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        No transaction data available
      </div>
    );
  }

  let running = initialBalance;
  const data = months.map(month => {
    const monthNet = transactions
      .filter(t => getMonthKey(t.date) === month)
      .reduce((s, t) => s + t.amount, 0);
    running += monthNet;
    return {
      month: fmtMonth(month),
      'Net Worth': Math.round(running * 100) / 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="networthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
          width={52}
        />
        <Tooltip
          contentStyle={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
          formatter={(val) => [fmtCurrency(Number(val ?? 0)), 'Net Worth']}
        />
        <Area
          type="monotone"
          dataKey="Net Worth"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#networthGradient)"
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
