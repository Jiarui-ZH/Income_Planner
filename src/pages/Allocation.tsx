import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Save,
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import { fmtCurrency, getMonthKey, formatPercent } from '../utils/helpers';
import type { BudgetFramework, AllocationItem } from '../types';

// ─── Tax calculations (Australian 2024–25) ────────────────────────────────────

function calcAuTax(gross: number): {
  tax: number;
  medicare: number;
  lito: number;
  net: number;
} {
  // Income tax brackets
  let incomeTax = 0;
  if (gross <= 18200) {
    incomeTax = 0;
  } else if (gross <= 45000) {
    incomeTax = (gross - 18200) * 0.19;
  } else if (gross <= 120000) {
    incomeTax = 5092 + (gross - 45000) * 0.325;
  } else if (gross <= 180000) {
    incomeTax = 29467 + (gross - 120000) * 0.37;
  } else {
    incomeTax = 51667 + (gross - 180000) * 0.45;
  }

  // Low Income Tax Offset (LITO)
  let lito = 0;
  if (gross <= 37500) {
    lito = 700;
  } else if (gross <= 45000) {
    lito = 700 - (gross - 37500) * 0.05;
  } else if (gross <= 66667) {
    lito = 325 - (gross - 45000) * 0.015;
  } else {
    lito = 0;
  }

  const taxAfterLito = Math.max(0, incomeTax - lito);
  const medicare = gross * 0.02;
  const net = gross - taxAfterLito - medicare;

  return { tax: taxAfterLito, medicare, lito, net };
}

// ─── Framework definitions ─────────────────────────────────────────────────────

interface FrameworkOption {
  id: BudgetFramework;
  label: string;
  description: string;
  tagline: string;
}

const FRAMEWORKS: FrameworkOption[] = [
  {
    id: 'fifty-thirty-twenty',
    label: '50/30/20 Rule',
    description: 'Needs 50%, Wants 30%, Savings 20%',
    tagline: 'Simple and balanced',
  },
  {
    id: 'pay-yourself-first',
    label: 'Pay Yourself First',
    description: 'Savings first, rest is discretionary',
    tagline: 'Prioritise saving',
  },
  {
    id: 'zero-based',
    label: 'Zero-Based',
    description: 'Every dollar is assigned a purpose',
    tagline: 'Maximum control',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Manual allocation per bucket',
    tagline: 'Fully flexible',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultAllocations(
  framework: BudgetFramework,
  bucketIds: string[],
): AllocationItem[] {
  if (bucketIds.length === 0) return [];

  switch (framework) {
    case 'fifty-thirty-twenty': {
      // Divide evenly within rough buckets — just spread the percentages
      const perBucket = Math.floor(100 / bucketIds.length);
      const remainder = 100 - perBucket * bucketIds.length;
      return bucketIds.map((id, i) => ({
        bucketId: id,
        percent: perBucket + (i === 0 ? remainder : 0),
      }));
    }
    case 'pay-yourself-first': {
      // First bucket gets 20%, rest split remaining evenly
      const first = 20;
      const rest = 80;
      if (bucketIds.length === 1) return [{ bucketId: bucketIds[0], percent: 100 }];
      const restCount = bucketIds.length - 1;
      const perRest = Math.floor(rest / restCount);
      const restRemainder = rest - perRest * restCount;
      return bucketIds.map((id, i) => ({
        bucketId: id,
        percent: i === 0 ? first : perRest + (i === 1 ? restRemainder : 0),
      }));
    }
    case 'zero-based': {
      const perBucket = Math.floor(100 / bucketIds.length);
      const remainder = 100 - perBucket * bucketIds.length;
      return bucketIds.map((id, i) => ({
        bucketId: id,
        percent: perBucket + (i === 0 ? remainder : 0),
      }));
    }
    case 'custom':
    default:
      return bucketIds.map(id => ({ bucketId: id, percent: 0 }));
  }
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Allocation() {
  const {
    transactions,
    budgetBuckets,
    incomeAllocation,
    settings,
    updateIncomeAllocation,
  } = useAppStore();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [framework, setFramework] = useState<BudgetFramework>(
    incomeAllocation.framework,
  );
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [saved, setSaved] = useState(false);

  // Income values come directly from Settings — no re-entry needed
  const grossNum      = settings.annualGrossIncome;
  const superRateNum  = settings.superRate;
  const netMonthlyNum = settings.monthlyNetIncome;
  const payCycle      = settings.payCycle;

  // Allocations: keyed by bucketId
  const [allocs, setAllocs] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of incomeAllocation.allocations) {
      map[item.bucketId] = item.percent;
    }
    return map;
  });

  // ── Tax calc ─────────────────────────────────────────────────────────────────
  const taxCalc = useMemo(() => calcAuTax(grossNum), [grossNum]);
  const superContrib = grossNum * (superRateNum / 100);
  const annualNet = taxCalc.net;
  const monthlyNetCalc = annualNet / 12;
  const fortnightlyNet = annualNet / 26;
  const weeklyNet = annualNet / 52;

  // ── Current month spend per bucket ───────────────────────────────────────────
  const currentMonthKey = getMonthKey(new Date());
  const bucketSpend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bucket of budgetBuckets) {
      map[bucket.id] = transactions
        .filter(
          t =>
            t.amount < 0 &&
            t.date.startsWith(currentMonthKey) &&
            bucket.categoryIds.includes(t.categoryId),
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0);
    }
    return map;
  }, [transactions, budgetBuckets, currentMonthKey]);

  // ── Total % allocated ─────────────────────────────────────────────────────────
  const totalPct = Object.values(allocs).reduce((s, v) => s + v, 0);
  const unallocatedPct = Math.max(0, 100 - totalPct);
  const isOver = totalPct > 100;

  function handleFrameworkChange(fw: BudgetFramework) {
    setFramework(fw);
    const defaults = buildDefaultAllocations(
      fw,
      budgetBuckets.map(b => b.id),
    );
    const newMap: Record<string, number> = {};
    for (const d of defaults) newMap[d.bucketId] = d.percent;
    setAllocs(newMap);
  }

  function handleSlider(bucketId: string, val: number) {
    setAllocs(prev => ({ ...prev, [bucketId]: val }));
  }

  function handleSave() {
    const allocations: AllocationItem[] = budgetBuckets.map(b => ({
      bucketId: b.id,
      percent: allocs[b.id] ?? 0,
    }));
    updateIncomeAllocation({ framework, monthlyNetIncome: netMonthlyNum, allocations });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const dollarFromPct = (pct: number) => (netMonthlyNum * pct) / 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Income Allocation</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Plan how your income is distributed across budget buckets
        </p>
      </div>

      {/* ── Income Summary (read from Settings) ─────────────────────────────── */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" />
            Income
          </h2>
          <Link
            to="/settings"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Settings size={13} /> Edit in Settings
          </Link>
        </div>

        {netMonthlyNum === 0 ? (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <Info size={16} className="text-amber-400 shrink-0" />
            <p className="text-sm text-slate-300">
              No income set.{' '}
              <Link to="/settings" className="text-emerald-400 underline">
                Go to Settings → Income & Super
              </Link>{' '}
              to enter your salary and the numbers will flow through automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Annual Gross',   value: fmtCurrency(grossNum, settings.currencySymbol) },
              { label: 'Super Rate',     value: `${superRateNum}%` },
              { label: 'Monthly Net',    value: fmtCurrency(netMonthlyNum, settings.currencySymbol) },
              { label: 'Pay Cycle',      value: payCycle.charAt(0).toUpperCase() + payCycle.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1a2744] rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}


        {/* Calculated breakdown */}
        {grossNum > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowTaxBreakdown(v => !v)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Info size={14} />
              Australian Tax Breakdown (2024–25)
              {showTaxBreakdown ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showTaxBreakdown && (
              <div className="bg-[#1a2744] rounded-lg p-4 border border-[#1e2d45]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Gross Income', value: fmtCurrency(grossNum), color: 'text-white' },
                    { label: 'Income Tax', value: `−${fmtCurrency(taxCalc.tax)}`, color: 'text-rose-400' },
                    { label: 'LITO Offset', value: `+${fmtCurrency(taxCalc.lito)}`, color: 'text-emerald-400' },
                    { label: 'Medicare Levy (2%)', value: `−${fmtCurrency(taxCalc.medicare)}`, color: 'text-rose-400' },
                    {
                      label: `Super (${superRateNum}% employer)`,
                      value: fmtCurrency(superContrib),
                      color: 'text-blue-400',
                    },
                    { label: 'Annual Net Take-Home', value: fmtCurrency(annualNet), color: 'text-emerald-400' },
                  ].map(row => (
                    <div key={row.label}>
                      <p className="text-slate-500 text-xs">{row.label}</p>
                      <p className={`font-semibold text-sm mt-0.5 ${row.color}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick income cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Annual Net', value: fmtCurrency(annualNet) },
                { label: 'Monthly Net', value: fmtCurrency(monthlyNetCalc) },
                { label: 'Fortnightly Net', value: fmtCurrency(fortnightlyNet) },
                { label: 'Weekly Net', value: fmtCurrency(weeklyNet) },
              ].map(card => (
                <div
                  key={card.label}
                  className="bg-[#1a2744] rounded-lg p-3 border border-[#1e2d45]"
                >
                  <p className="text-slate-400 text-xs">{card.label}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Framework selector ───────────────────────────────────────────────── */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Budget Framework</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FRAMEWORKS.map(fw => (
            <button
              key={fw.id}
              type="button"
              onClick={() => handleFrameworkChange(fw.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                framework === fw.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[#1e2d45] bg-[#1a2744] hover:border-[#2a3d5a]'
              }`}
            >
              <p
                className={`font-semibold text-sm ${
                  framework === fw.id ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {fw.label}
              </p>
              <p className="text-slate-400 text-xs mt-1">{fw.description}</p>
              <p className="text-slate-500 text-xs mt-1 italic">{fw.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Allocation table ─────────────────────────────────────────────────── */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Bucket Allocations</h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                isOver
                  ? 'bg-rose-500/15 text-rose-400'
                  : totalPct === 100
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-[#1a2744] text-slate-400'
              }`}
            >
              {formatPercent(totalPct, 0)} allocated
            </span>
          </div>
        </div>

        {isOver && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
            <span className="text-rose-400 text-sm font-medium">
              Allocation exceeds 100% — reduce some buckets to balance the plan.
            </span>
          </div>
        )}

        {budgetBuckets.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No budget buckets yet. Create buckets on the Budget page first.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_3fr_1fr_1fr_1fr] gap-4 px-3">
              {['Bucket', '%', 'Slider', '$ Allocated', 'Actual Spent', 'Variance'].map(h => (
                <span key={h} className="text-slate-500 text-xs font-medium">
                  {h}
                </span>
              ))}
            </div>

            {budgetBuckets.map(bucket => {
              const pct = allocs[bucket.id] ?? 0;
              const allocated = dollarFromPct(pct);
              const spent = bucketSpend[bucket.id] ?? 0;
              const variance = allocated - spent;

              return (
                <div
                  key={bucket.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_3fr_1fr_1fr_1fr] gap-3 items-center bg-[#1a2744] rounded-xl p-3 border border-[#1e2d45]"
                >
                  {/* Bucket name */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="text-white text-sm font-medium truncate">
                      {bucket.name}
                    </span>
                  </div>

                  {/* % input */}
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={pct}
                      onChange={e =>
                        handleSlider(bucket.id, Math.min(100, Math.max(0, Number(e.target.value))))
                      }
                      className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full text-center"
                    />
                  </div>

                  {/* Slider */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={pct}
                      onChange={e => handleSlider(bucket.id, Number(e.target.value))}
                      className="w-full accent-emerald-500"
                      style={
                        {
                          '--range-color': bucket.color,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* $ Allocated */}
                  <div>
                    <span className="text-white text-sm font-medium">
                      {fmtCurrency(allocated)}
                    </span>
                  </div>

                  {/* Actual spent */}
                  <div>
                    <span className="text-slate-300 text-sm">{fmtCurrency(spent)}</span>
                  </div>

                  {/* Variance */}
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {variance >= 0 ? '+' : ''}
                      {fmtCurrency(variance)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Unallocated row */}
            {unallocatedPct > 0 && (
              <div className="flex items-center justify-between bg-[#131e35] rounded-xl p-3 border border-dashed border-[#1e2d45]">
                <span className="text-slate-500 text-sm italic">Unallocated</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-sm">
                    {formatPercent(unallocatedPct, 0)}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {fmtCurrency(dollarFromPct(unallocatedPct))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actual vs Planned chart ──────────────────────────────────────────── */}
      {budgetBuckets.length > 0 && (
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Actual vs Planned
          </h2>

          <div className="space-y-4">
            {budgetBuckets.map(bucket => {
              const pct = allocs[bucket.id] ?? 0;
              const allocated = dollarFromPct(pct);
              const spent = bucketSpend[bucket.id] ?? 0;
              const maxVal = Math.max(allocated, spent, 1);
              const allocPct = (allocated / maxVal) * 100;
              const spentPct = (spent / maxVal) * 100;
              const over = spent > allocated && allocated > 0;

              return (
                <div key={bucket.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      <span className="text-white text-sm">{bucket.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        Planned: {fmtCurrency(allocated)}
                      </span>
                      <span
                        className={over ? 'text-rose-400 font-medium' : 'text-slate-300'}
                      >
                        Actual: {fmtCurrency(spent)}
                      </span>
                    </div>
                  </div>

                  {/* Planned bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-16 text-right shrink-0">
                      Planned
                    </span>
                    <div className="flex-1 h-3 bg-[#1a2744] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${allocPct}%`,
                          backgroundColor: bucket.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Actual bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-16 text-right shrink-0">
                      Actual
                    </span>
                    <div className="flex-1 h-3 bg-[#1a2744] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${spentPct}%`,
                          backgroundColor: over ? '#f43f5e' : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#1e2d45]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400 opacity-80" />
              <span className="text-slate-400 text-xs">Planned (bucket color)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-xs">Actual (under budget)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-400 text-xs">Actual (over budget)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Save button ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Allocation'}
        </button>
      </div>
    </div>
  );
}
