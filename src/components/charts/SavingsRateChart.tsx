import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { Transaction } from '../../types';
import { getLastNMonths, getMonthKey, fmtMonth } from '../../utils/helpers';

interface Props {
  transactions: Transaction[];
}

export default function SavingsRateChart({ transactions }: Props) {
  const months = getLastNMonths(6);

  const data = months.map(month => {
    const txs = transactions.filter(t => getMonthKey(t.date) === month);
    const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return {
      month: fmtMonth(month),
      'Savings Rate': Math.round(rate * 10) / 10,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
          tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
          width={44}
        />
        <Tooltip
          contentStyle={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
          formatter={(val) => [`${Number(val ?? 0).toFixed(1)}%`, 'Savings Rate']}
        />
        <ReferenceLine
          y={20}
          stroke="#f59e0b"
          strokeDasharray="5 3"
          label={{ value: '20% target', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
        />
        <Area
          type="monotone"
          dataKey="Savings Rate"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#savingsGradient)"
          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
