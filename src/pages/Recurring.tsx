import { useState, useMemo } from 'react';
import {
  Plus, RefreshCw, Edit2, Trash2, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, Calendar, Search, ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { fmtCurrency, fmtDate, nanoid } from '../utils/helpers';
import type { RecurringItem, RecurringFrequency, TransactionType, Category, Account } from '../types';

// ── helpers ────────────────────────────────────────────────────────────────────

function frequencyLabel(f: RecurringFrequency): string {
  const labels: Record<RecurringFrequency, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };
  return labels[f];
}

/** Convert an amount to monthly equivalent for summary stats */
function toMonthly(amount: number, frequency: RecurringFrequency): number {
  switch (frequency) {
    case 'weekly':      return amount * 52 / 12;
    case 'fortnightly': return amount * 26 / 12;
    case 'monthly':     return amount;
    case 'quarterly':   return amount / 3;
    case 'annual':      return amount / 12;
  }
}

/** Advance a date by one frequency period and return YYYY-MM-DD */
function advanceDate(dateStr: string, frequency: RecurringFrequency): string {
  const d = new Date(dateStr + 'T00:00:00');
  switch (frequency) {
    case 'weekly':      d.setDate(d.getDate() + 7); break;
    case 'fortnightly': d.setDate(d.getDate() + 14); break;
    case 'monthly':     d.setMonth(d.getMonth() + 1); break;
    case 'quarterly':   d.setMonth(d.getMonth() + 3); break;
    case 'annual':      d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── sub-components ─────────────────────────────────────────────────────────────

interface FormState {
  type: TransactionType;
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  nextExpectedDate: string;
  active: boolean;
}

function defaultForm(categories: Category[], accounts: Account[]): FormState {
  const defaultCat = categories.find(c => c.type === 'expense') ?? categories[0];
  const defaultAcc = accounts[0];
  return {
    type: 'expense',
    description: '',
    amount: '',
    categoryId: defaultCat?.id ?? '',
    accountId: defaultAcc?.id ?? '',
    frequency: 'monthly',
    nextExpectedDate: today(),
    active: true,
  };
}

interface RecurringFormProps {
  initialValues?: RecurringItem;
  categories: Category[];
  accounts: Account[];
  onSave: (values: FormState) => void;
  onCancel: () => void;
}

function RecurringForm({ initialValues, categories, accounts, onSave, onCancel }: RecurringFormProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (initialValues) {
      return {
        type: initialValues.type,
        description: initialValues.description,
        amount: String(initialValues.amount),
        categoryId: initialValues.categoryId,
        accountId: initialValues.accountId,
        frequency: initialValues.frequency,
        nextExpectedDate: initialValues.nextExpectedDate,
        active: initialValues.active,
      };
    }
    return defaultForm(categories, accounts);
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === form.type || c.type === 'both'),
    [categories, form.type]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) return;
    onSave(form);
  };

  const inputCls = 'bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full';
  const labelCls = 'block text-slate-400 text-xs mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <span className={labelCls}>Type</span>
        <div className="flex gap-2">
          {(['income', 'expense'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                set('type', t);
                const first = categories.find(c => c.type === t || c.type === 'both');
                if (first) set('categoryId', first.id);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                form.type === t
                  ? t === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'bg-[#1a2744] text-slate-400 hover:text-white border border-[#1e2d45]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. Netflix, Rent, Salary"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className={labelCls}>Amount ($)</label>
        <input
          type="number"
          className={inputCls}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category</label>
        <div className="relative">
          <select
            className={inputCls + ' appearance-none pr-8'}
            value={form.categoryId}
            onChange={e => set('categoryId', e.target.value)}
          >
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Account */}
      <div>
        <label className={labelCls}>Account</label>
        <div className="relative">
          <select
            className={inputCls + ' appearance-none pr-8'}
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className={labelCls}>Frequency</label>
        <div className="relative">
          <select
            className={inputCls + ' appearance-none pr-8'}
            value={form.frequency}
            onChange={e => set('frequency', e.target.value as RecurringFrequency)}
          >
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Next expected date */}
      <div>
        <label className={labelCls}>Next Expected Date</label>
        <input
          type="date"
          className={inputCls}
          value={form.nextExpectedDate}
          onChange={e => set('nextExpectedDate', e.target.value)}
          required
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Active</span>
        <button
          type="button"
          onClick={() => set('active', !form.active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.active ? 'bg-emerald-500' : 'bg-[#1a2744] border border-[#1e2d45]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
        >
          Save
        </button>
      </div>
    </form>
  );
}

// ── detected pattern type ──────────────────────────────────────────────────────

interface DetectedPattern {
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  occurrences: number;
  lastDate: string;
}

// ── main page ──────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'income' | 'expense' | 'active' | 'paused';

export default function Recurring() {
  const store = useAppStore();
  const { recurringItems, categories, accounts, transactions, settings } = store;

  const sym = settings.currencySymbol;

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[] | null>(null);
  const [detecting, setDetecting] = useState(false);

  // ── summary stats ────────────────────────────────────────────────────────────

  const { monthlyIncome, monthlyExpenses, netRecurring } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const item of recurringItems) {
      if (!item.active) continue;
      const m = toMonthly(item.amount, item.frequency);
      if (item.type === 'income') inc += m;
      else exp += m;
    }
    return { monthlyIncome: inc, monthlyExpenses: exp, netRecurring: inc - exp };
  }, [recurringItems]);

  // ── upcoming (next 30 days) ──────────────────────────────────────────────────

  const todayStr = today();
  const in30 = addDays(todayStr, 30);

  const upcomingItems = useMemo(() =>
    recurringItems
      .filter(item => item.active && item.nextExpectedDate <= in30)
      .sort((a, b) => a.nextExpectedDate.localeCompare(b.nextExpectedDate)),
    [recurringItems, in30]
  );

  // ── filtered table items ─────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return recurringItems.filter(item => {
      if (filter === 'income'  && item.type !== 'income')    return false;
      if (filter === 'expense' && item.type !== 'expense')   return false;
      if (filter === 'active'  && !item.active)              return false;
      if (filter === 'paused'  && item.active)               return false;
      if (search && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [recurringItems, filter, search]);

  // ── actions ──────────────────────────────────────────────────────────────────

  function handleSave(values: FormState) {
    const amt = parseFloat(values.amount);
    if (editingItem) {
      store.updateRecurringItem(editingItem.id, {
        type: values.type,
        description: values.description,
        amount: amt,
        categoryId: values.categoryId,
        accountId: values.accountId,
        frequency: values.frequency,
        nextExpectedDate: values.nextExpectedDate,
        active: values.active,
      });
    } else {
      store.addRecurringItem({
        type: values.type,
        description: values.description,
        amount: amt,
        categoryId: values.categoryId,
        accountId: values.accountId,
        frequency: values.frequency,
        nextExpectedDate: values.nextExpectedDate,
        active: values.active,
        linkedTransactionIds: [],
      });
    }
    setShowModal(false);
    setEditingItem(null);
  }

  function handleMarkPaid(item: RecurringItem) {
    const txDate = item.nextExpectedDate <= todayStr ? item.nextExpectedDate : todayStr;
    const signedAmount = item.type === 'income' ? item.amount : -item.amount;
    const txId = 'tx_' + nanoid();

    store.addTransaction({
      date: txDate,
      description: item.description,
      amount: signedAmount,
      categoryId: item.categoryId,
      accountId: item.accountId,
      type: item.type,
      tags: ['recurring'],
      notes: `Auto-recorded from recurring item: ${item.description}`,
      isRecurring: true,
      recurringId: item.id,
    });

    store.updateRecurringItem(item.id, {
      lastSeenDate: txDate,
      nextExpectedDate: advanceDate(item.nextExpectedDate, item.frequency),
      linkedTransactionIds: [...item.linkedTransactionIds, txId],
    });
  }

  function handleToggleActive(item: RecurringItem) {
    store.updateRecurringItem(item.id, { active: !item.active });
  }

  function openEdit(item: RecurringItem) {
    setEditingItem(item);
    setShowModal(true);
  }

  function openAdd() {
    setEditingItem(null);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    store.deleteRecurringItem(id);
    setDeleteConfirmId(null);
  }

  // ── auto-detection ────────────────────────────────────────────────────────────

  function detectRecurring() {
    setDetecting(true);
    const patterns: DetectedPattern[] = [];
    const descMap: Map<string, typeof transactions> = new Map();

    // Group transactions by normalised description
    for (const tx of transactions) {
      const key = tx.description.toLowerCase().trim();
      const arr = descMap.get(key) ?? [];
      arr.push(tx);
      descMap.set(key, arr);
    }

    for (const [, txGroup] of descMap) {
      if (txGroup.length < 3) continue;

      const sorted = [...txGroup].sort((a, b) => a.date.localeCompare(b.date));
      const amounts = sorted.map(t => Math.abs(t.amount));
      const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
      const consistent = amounts.every(a => Math.abs(a - median) / median <= 0.1);
      if (!consistent) continue;

      // Determine frequency from intervals
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const a = new Date(sorted[i - 1].date).getTime();
        const b = new Date(sorted[i].date).getTime();
        intervals.push((b - a) / (1000 * 60 * 60 * 24));
      }
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;

      let frequency: RecurringFrequency | null = null;
      if (avgInterval >= 5  && avgInterval <= 9)   frequency = 'weekly';
      if (avgInterval >= 12 && avgInterval <= 16)  frequency = 'fortnightly';
      if (avgInterval >= 26 && avgInterval <= 35)  frequency = 'monthly';
      if (avgInterval >= 85 && avgInterval <= 95)  frequency = 'quarterly';
      if (avgInterval >= 350 && avgInterval <= 380) frequency = 'annual';
      if (!frequency) continue;

      // Skip already-tracked descriptions
      const alreadyTracked = recurringItems.some(
        r => r.description.toLowerCase().trim() === sorted[0].description.toLowerCase().trim()
      );
      if (alreadyTracked) continue;

      const last = sorted[sorted.length - 1];
      patterns.push({
        description: last.description,
        amount: median,
        frequency,
        type: last.type === 'transfer' ? 'expense' : last.type,
        categoryId: last.categoryId,
        accountId: last.accountId,
        occurrences: txGroup.length,
        lastDate: last.date,
      });
    }

    setDetectedPatterns(patterns);
    setDetecting(false);
  }

  function addDetectedAsRecurring(p: DetectedPattern) {
    store.addRecurringItem({
      description: p.description,
      amount: p.amount,
      frequency: p.frequency,
      type: p.type,
      categoryId: p.categoryId,
      accountId: p.accountId,
      nextExpectedDate: advanceDate(p.lastDate, p.frequency),
      lastSeenDate: p.lastDate,
      active: true,
      linkedTransactionIds: [],
    });
    setDetectedPatterns(prev => prev ? prev.filter(d => d.description !== p.description) : null);
  }

  // ── render helpers ────────────────────────────────────────────────────────────

  function getCategoryName(id: string): string {
    return categories.find(c => c.id === id)?.name ?? id;
  }

  function getAccountName(id: string): string {
    return accounts.find(a => a.id === id)?.name ?? id;
  }

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all',     label: 'All' },
    { value: 'income',  label: 'Income' },
    { value: 'expense', label: 'Expenses' },
    { value: 'active',  label: 'Active' },
    { value: 'paused',  label: 'Paused' },
  ];

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recurring Transactions</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {recurringItems.filter(r => r.active).length} active items
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Recurring
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">Monthly Income</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {fmtCurrency(monthlyIncome, sym)}
          </p>
        </div>

        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-rose-500/10 p-2 rounded-lg">
              <TrendingDown size={18} className="text-rose-400" />
            </div>
            <span className="text-slate-400 text-sm">Monthly Expenses</span>
          </div>
          <p className="text-2xl font-bold text-rose-400">
            {fmtCurrency(monthlyExpenses, sym)}
          </p>
        </div>

        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${netRecurring >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Calendar size={18} className={netRecurring >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            </div>
            <span className="text-slate-400 text-sm">Net Recurring</span>
          </div>
          <p className={`text-2xl font-bold ${netRecurring >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netRecurring < 0 ? '-' : ''}{fmtCurrency(Math.abs(netRecurring), sym)}
          </p>
        </div>
      </div>

      {/* Upcoming this month */}
      {upcomingItems.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-3">Upcoming in Next 30 Days</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingItems.map(item => {
              const isOverdue = item.nextExpectedDate < todayStr;
              return (
                <div
                  key={item.id}
                  className={`bg-[#0d1526] border rounded-xl p-4 ${
                    isOverdue ? 'border-amber-500/40' : 'border-[#1e2d45]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-[#1a2744] text-slate-300 text-xs px-2 py-0.5 rounded-full border border-[#1e2d45]">
                          {frequencyLabel(item.frequency)}
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs">
                            <AlertTriangle size={11} />
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-base font-bold ml-3 shrink-0 ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.type === 'income' ? '+' : '-'}{fmtCurrency(item.amount, sym)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      <span>Due </span>
                      <span className={isOverdue ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                        {fmtDate(item.nextExpectedDate)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkPaid(item)}
                      className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <CheckCircle size={12} />
                      Mark Paid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All recurring items table */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-[#1e2d45]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-1 flex-wrap">
              {tabs.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFilter(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === t.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#1a2744] text-slate-400 hover:text-white border border-[#1e2d45]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 relative sm:max-w-xs ml-auto">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#0d1526] border border-[#1e2d45] rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors w-full"
              />
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="No recurring items"
            description="Add recurring transactions like rent, subscriptions, and salary to track them here."
            action={
              <button
                onClick={openAdd}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={15} />
                Add Recurring
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {['Active', 'Description', 'Category', 'Account', 'Frequency', 'Next Due', 'Last Seen', 'Amount', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left text-xs text-slate-400 font-medium px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isOverdue = item.active && item.nextExpectedDate < todayStr;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2744]/40 transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-[#0a1020]/30'
                      }`}
                    >
                      {/* Active toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            item.active ? 'bg-emerald-500' : 'bg-[#1a2744] border border-[#1e2d45]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              item.active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{item.description}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-slate-300 text-xs">{getCategoryName(item.categoryId)}</span>
                      </td>

                      {/* Account */}
                      <td className="px-4 py-3">
                        <span className="text-slate-300 text-xs">{getAccountName(item.accountId)}</span>
                      </td>

                      {/* Frequency */}
                      <td className="px-4 py-3">
                        <span className="bg-[#1a2744] text-slate-300 text-xs px-2 py-0.5 rounded-full border border-[#1e2d45]">
                          {frequencyLabel(item.frequency)}
                        </span>
                      </td>

                      {/* Next due */}
                      <td className="px-4 py-3">
                        <span className={`text-xs ${isOverdue ? 'text-amber-400 font-medium' : 'text-slate-300'}`}>
                          {fmtDate(item.nextExpectedDate)}
                          {isOverdue && (
                            <span className="ml-1 text-amber-400">
                              <AlertTriangle size={10} className="inline" />
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Last seen */}
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs">
                          {item.lastSeenDate ? fmtDate(item.lastSeenDate) : '—'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'income' ? '+' : '-'}{fmtCurrency(item.amount, sym)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-detection section */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold">Auto-Detection</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Analyse your transaction history to find recurring patterns automatically.
            </p>
          </div>
          <button
            onClick={detectRecurring}
            disabled={detecting}
            className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2 shrink-0 disabled:opacity-60"
          >
            <Search size={14} />
            {detecting ? 'Detecting…' : 'Detect Recurring'}
          </button>
        </div>

        {detectedPatterns !== null && (
          <>
            {detectedPatterns.length === 0 ? (
              <div className="bg-[#1a2744]/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">
                  No new recurring patterns found. All patterns may already be tracked, or there isn't enough transaction history yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs mb-3">
                  Found {detectedPatterns.length} potential recurring pattern{detectedPatterns.length !== 1 ? 's' : ''}:
                </p>
                {detectedPatterns.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-[#1a2744]/50 rounded-lg px-4 py-3 border border-[#1e2d45]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="bg-[#0d1526] text-slate-300 text-xs px-2 py-0.5 rounded-full border border-[#1e2d45]">
                          {frequencyLabel(p.frequency)}
                        </span>
                        <span className="text-slate-400 text-xs">{p.occurrences} occurrences</span>
                        <span className="text-slate-400 text-xs">Last: {fmtDate(p.lastDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`text-sm font-semibold ${p.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.type === 'income' ? '+' : '-'}{fmtCurrency(p.amount, sym)}
                      </span>
                      <button
                        onClick={() => addDetectedAsRecurring(p)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Add as Recurring
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <Modal
          title={editingItem ? 'Edit Recurring Item' : 'Add Recurring Item'}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          size="md"
        >
          <RecurringForm
            initialValues={editingItem ?? undefined}
            categories={categories}
            accounts={accounts}
            onSave={handleSave}
            onCancel={() => { setShowModal(false); setEditingItem(null); }}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId !== null && (
        <Modal
          title="Delete Recurring Item"
          onClose={() => setDeleteConfirmId(null)}
          size="sm"
        >
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to delete this recurring item? This will not delete any already-recorded transactions.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
