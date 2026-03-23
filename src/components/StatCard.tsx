import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  valueColor?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-blue-600', trend, valueColor }: StatCardProps) {
  return (
    <div className="bg-[#0d1526] border border-[#1e2d45] p-5 hover:border-[#2a3d5a] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-[#1a2744] p-2.5">
          <Icon size={17} className={iconColor} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 ${
            trend.value >= 0
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-rose-500/10 text-rose-600'
          }`}>
            {trend.value >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.value).toFixed(1)}%
            {trend.label && ` ${trend.label}`}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueColor ?? 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
