import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Home,
  UtensilsCrossed,
  Car,
  Zap,
  HeartPulse,
  Sparkles,
  ShoppingBag,
  PiggyBank,
  Plane,
  GraduationCap,
  Shield,
  Briefcase,
  Star,
  Wallet,
  AlertTriangle,
  LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useAppStore } from '../store/StoreContext';
import { fmtCurrency, fmtMonth, getMonthKey } from '../utils/helpers';
import { CATEGORY_MAP } from '../utils/categories';
import type { BudgetBucket } from '../types';

// ─── Icon registry ─────────────────────────────────────────────────────────────

const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Home', icon: Home },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed },
  { name: 'Car', icon: Car },
  { name: 'Zap', icon: Zap },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Plane', icon: Plane },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Shield', icon: Shield },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Star', icon: Star },
];

function getIcon(name: string): LucideIcon {
  return ICON_OPTIONS.find(i => i.name === name)?.icon ?? Wallet;
}

// ─── Colour palette ────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { label: 'Emerald', value: '#10b981' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Lime', value: '#84cc16' },
];

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.min(pct, 100);
  const barColor = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : color;
  return (
    <div className="w-full h-2 bg-[#1a2744] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

// ─── Bucket form data ──────────────────────────────────────────────────────────

interface BucketFormData {
  name: string;
  icon: string;
  color: string;
  monthlyLimit: string;
  categoryIds: string[];
  rollover: boolean;
}

const DEFAULT_FORM: BucketFormData = {
  name: '',
  icon: 'Home',
  color: '#10b981',
  monthlyLimit: '',
  categoryIds: [],
  rollover: false,
};

// ─── Bucket modal ──────────────────────────────────────────────────────────────

interface BucketModalProps {
  initial: BudgetBucket | null;
  onSave: (data: BucketFormData) => void;
  onClose: () => void;
}

function BucketModal({ initial, onSave, onClose }: BucketModalProps) {
  const { categories } = useAppStore();
  const expenseCategories = categories.filter(
    c => c.type === 'expense' || c.type === 'both',
  );

  const [form, setForm] = useState<BucketFormData>(
    initial
      ? {
          name: initial.name,
          icon: initial.icon,
          color: initial.color,
          monthlyLimit: String(initial.monthlyLimit),
          categoryIds: [...initial.categoryIds],
          rollover: initial.rollover,
        }
      : DEFAULT_FORM,
  );

  function toggleCategory(catId: string) {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter(id => id !== catId)
        : [...f.categoryIds, catId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.monthlyLimit) return;
    onSave(form);
  }

  const SelectedIcon = getIcon(form.icon);

  return (
    <Modal
      title={initial ? 'Edit Budget Bucket' : 'New Budget Bucket'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Bucket Name</label>
          <input
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            placeholder="e.g. Groceries &amp; Food"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(({ name, icon: Ic }) => (
              <button
                key={name}
                type="button"
                onClick={() => setForm(f => ({ ...f, icon: name }))}
                className={`p-2 rounded-lg border transition-colors ${
                  form.icon === name
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-[#1e2d45] bg-[#1a2744] hover:border-[#2a3d5a]'
                }`}
              >
                <Ic
                  size={18}
                  className={form.icon === name ? 'text-emerald-400' : 'text-slate-400'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c.value }))}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  form.color === c.value ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-[#1a2744] rounded-lg border border-[#1e2d45]">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: form.color + '33' }}
          >
            <SelectedIcon size={18} style={{ color: form.color }} />
          </div>
          <span className="text-white text-sm font-medium">
            {form.name || 'Bucket Preview'}
          </span>
        </div>

        {/* Monthly limit */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Monthly Limit ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            placeholder="0.00"
            value={form.monthlyLimit}
            onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))}
            required
          />
        </div>

        {/* Category multi-select */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Assign Categories{' '}
            <span className="text-slate-500">({form.categoryIds.length} selected)</span>
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {expenseCategories.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a2744] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="accent-emerald-500 w-4 h-4 shrink-0"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-slate-300 text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rollover toggle */}
        <div className="flex items-center justify-between p-3 bg-[#1a2744] rounded-lg border border-[#1e2d45]">
          <div>
            <p className="text-white text-sm font-medium">Rollover unused budget</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Unspent amount carries over to the next month
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, rollover: !f.rollover }))}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              form.rollover ? 'bg-emerald-500' : 'bg-[#1e2d45]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.rollover ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
          >
            {initial ? 'Save Changes' : 'Create Bucket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Budget() {
  const {
    transactions,
    categories,
    budgetBuckets,
    addBudgetBucket,
    updateBudgetBucket,
    deleteBudgetBucket,
  } = useAppStore();

  const [viewDate, setViewDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editBucket, setEditBucket] = useState<BudgetBucket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthKey = getMonthKey(viewDate);
  const isCurrentMonth = getMonthKey(new Date()) === monthKey;

  function prevMonth() {
    setViewDate(d => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() - 1);
      return nd;
    });
  }

  function nextMonth() {
    setViewDate(d => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + 1);
      return nd;
    });
  }

  const bucketSpend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bucket of budgetBuckets) {
      map[bucket.id] = transactions
        .filter(
          t =>
            t.amount < 0 &&
            t.date.startsWith(monthKey) &&
            bucket.categoryIds.includes(t.categoryId),
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0);
    }
    return map;
  }, [transactions, budgetBuckets, monthKey]);

  const totalBudgeted = budgetBuckets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = Object.values(bucketSpend).reduce((s, v) => s + v, 0);
  const remaining = totalBudgeted - totalSpent;
  const overCount = budgetBuckets.filter(
    b => (bucketSpend[b.id] ?? 0) > b.monthlyLimit,
  ).length;

  function handleSave(data: BucketFormData) {
    const limit = parseFloat(data.monthlyLimit) || 0;
    if (editBucket) {
      updateBudgetBucket(editBucket.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        monthlyLimit: limit,
        categoryIds: data.categoryIds,
        rollover: data.rollover,
      });
    } else {
      addBudgetBucket({
        name: data.name,
        icon: data.icon,
        color: data.color,
        monthlyLimit: limit,
        categoryIds: data.categoryIds,
        rollover: data.rollover,
        order: budgetBuckets.length,
      });
    }
    setShowModal(false);
    setEditBucket(null);
  }

  const sortedBuckets = useMemo(
    () => [...budgetBuckets].sort((a, b) => a.order - b.order),
    [budgetBuckets],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Budget Buckets</h1>
          <p className="text-slate-400 text-sm mt-0.5">{fmtMonth(monthKey)}</p>
        </div>
        <button
          onClick={() => {
            setEditBucket(null);
            setShowModal(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Bucket
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="bg-[#1a2744] hover:bg-[#243355] text-white p-2 rounded-lg border border-[#1e2d45] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-white font-medium min-w-[130px] text-center">
          {fmtMonth(monthKey)}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="bg-[#1a2744] hover:bg-[#243355] text-white p-2 rounded-lg border border-[#1e2d45] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => setViewDate(new Date())}
            className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors ml-1"
          >
            Back to current
          </button>
        )}
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budgeted"
          value={fmtCurrency(totalBudgeted)}
          icon={Wallet}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Total Spent"
          value={fmtCurrency(totalSpent)}
          icon={ShoppingBag}
          iconColor="text-orange-400"
          valueColor={totalSpent > totalBudgeted ? 'text-rose-400' : 'text-white'}
        />
        <StatCard
          title="Remaining"
          value={fmtCurrency(Math.abs(remaining))}
          subtitle={remaining < 0 ? 'over budget' : 'left to spend'}
          icon={PiggyBank}
          iconColor={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          valueColor={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <StatCard
          title="Buckets Over Limit"
          value={String(overCount)}
          icon={AlertTriangle}
          iconColor={overCount > 0 ? 'text-rose-400' : 'text-emerald-400'}
          valueColor={overCount > 0 ? 'text-rose-400' : 'text-white'}
        />
      </div>

      {/* Bucket grid */}
      {sortedBuckets.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No budget buckets yet"
          description="Create budget buckets to organise spending by category and track against monthly limits."
          action={
            <button
              onClick={() => {
                setEditBucket(null);
                setShowModal(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Create your first bucket
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedBuckets.map(bucket => {
            const spent = bucketSpend[bucket.id] ?? 0;
            const limit = bucket.monthlyLimit;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const over = spent > limit;
            const BucketIcon = getIcon(bucket.icon);

            const assignedCategories = bucket.categoryIds.map(
              id => CATEGORY_MAP[id] ?? categories.find(c => c.id === id),
            ).filter(Boolean);

            return (
              <div
                key={bucket.id}
                className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors"
              >
                {/* Bucket header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bucket.color + '22' }}
                    >
                      <BucketIcon size={20} style={{ color: bucket.color }} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{bucket.name}</h3>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          bucket.rollover
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-[#1a2744] text-slate-500'
                        }`}
                      >
                        {bucket.rollover ? 'Rollover ON' : 'Rollover OFF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditBucket(bucket);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(bucket.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <ProgressBar pct={pct} color={bucket.color} />
                </div>

                {/* Spend numbers */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-xs">
                    {fmtCurrency(spent)} spent of {fmtCurrency(limit)}
                  </span>
                  {over ? (
                    <span className="text-xs font-medium text-rose-400">
                      Over by {fmtCurrency(spent - limit)}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-medium ${
                        pct > 70 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {Math.round(100 - pct)}% remaining
                    </span>
                  )}
                </div>

                {/* Category pills */}
                {assignedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {assignedCategories.map(cat => (
                      <span
                        key={cat!.id}
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: cat!.color + '18',
                          borderColor: cat!.color + '40',
                          color: cat!.color,
                        }}
                      >
                        {cat!.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs italic">No categories assigned</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit modal */}
      {showModal && (
        <BucketModal
          initial={editBucket}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditBucket(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deletingId !== null && (
        <Modal title="Delete Bucket" onClose={() => setDeletingId(null)} size="sm">
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to delete this budget bucket? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingId(null)}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteBudgetBucket(deletingId);
                setDeletingId(null);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
