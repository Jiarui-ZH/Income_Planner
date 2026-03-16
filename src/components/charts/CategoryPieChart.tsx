import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { Transaction, Category } from '../../types';
import { getMonthKey, fmtCurrency } from '../../utils/helpers';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  monthKey?: string;
}

export default function CategoryPieChart({ transactions, categories, monthKey }: Props) {
  const currentMonth = monthKey ?? getMonthKey(new Date());

  const expenseTxs = transactions.filter(
    t => t.amount < 0 && getMonthKey(t.date) === currentMonth
  );

  const totals: Record<string, number> = {};
  for (const t of expenseTxs) {
    totals[t.categoryId] = (totals[t.categoryId] ?? 0) + Math.abs(t.amount);
  }

  const catMap: Record<string, Category> = {};
  for (const c of categories) catMap[c.id] = c;

  const sorted = Object.entries(totals)
    .map(([catId, amount]) => ({
      name: catMap[catId]?.name ?? catId,
      value: Math.round(amount * 100) / 100,
      color: catMap[catId]?.color ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">
        No expense data for this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={sorted}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
        >
          {sorted.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
          formatter={(val) => [fmtCurrency(Number(val ?? 0)), '']}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
