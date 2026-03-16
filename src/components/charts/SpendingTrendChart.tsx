import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { Transaction, Category } from '../../types';
import { getLastNMonths, getMonthKey, fmtCurrency, fmtMonth } from '../../utils/helpers';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  months?: number;
}

export default function SpendingTrendChart({ transactions, categories, months = 6 }: Props) {
  const monthKeys = getLastNMonths(months);

  const catMap: Record<string, Category> = {};
  for (const c of categories) catMap[c.id] = c;

  // Aggregate total spend per category across all months
  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    if (!monthKeys.includes(getMonthKey(t.date))) continue;
    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] ?? 0) + Math.abs(t.amount);
  }

  // Top 5 spending categories
  const top5 = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const data = monthKeys.map(month => {
    const row: Record<string, number | string> = { month: fmtMonth(month) };
    for (const catId of top5) {
      const spent = transactions
        .filter(t => t.categoryId === catId && t.amount < 0 && getMonthKey(t.date) === month)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      row[catMap[catId]?.name ?? catId] = Math.round(spent * 100) / 100;
    }
    return row;
  });

  const LINE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
          tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(1)}k`}
          width={52}
        />
        <Tooltip
          contentStyle={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
          formatter={(val) => [fmtCurrency(Number(val ?? 0)), '']}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        {top5.map((catId, i) => (
          <Line
            key={catId}
            type="monotone"
            dataKey={catMap[catId]?.name ?? catId}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: LINE_COLORS[i % LINE_COLORS.length] }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
