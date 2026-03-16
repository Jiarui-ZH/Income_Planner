import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { Transaction } from '../../types';
import { getLastNMonths, getMonthKey, fmtCurrency, fmtMonth } from '../../utils/helpers';

interface Props {
  transactions: Transaction[];
}

export default function CashFlowChart({ transactions }: Props) {
  const months = getLastNMonths(6);

  const data = months.map(month => {
    const monthTxs = transactions.filter(t => getMonthKey(t.date) === month);
    const income = monthTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expenses;
    return {
      month: fmtMonth(month),
      Income: Math.round(income * 100) / 100,
      Expenses: Math.round(expenses * 100) / 100,
      Net: Math.round(net * 100) / 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
          formatter={(val) => [fmtCurrency(Number(val ?? 0)), '']}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
        />
        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="Net"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
