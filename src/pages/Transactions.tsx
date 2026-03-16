import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search, Plus, X, ChevronUp, ChevronDown, Pencil, Trash2,
  Check, ChevronsUpDown, Download, Tag, Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { fmtCurrency, fmtDate } from '../utils/helpers';
import type { Transaction, TransactionType, Category } from '../types';

// ─── Keyword extraction ───────────────────────────────────────────────────────

// Strips noise words and extracts the first 1-2 meaningful words as a keyword.
// e.g. "COLES 0748 MACQUARIE AU" → "coles"
//      "Club Lime Mitchell AUS Card xx3698" → "club lime"
//      "Spotify P403FB920D Sydney AU" → "spotify"
function extractKeyword(description: string): string {
  return description
    .toLowerCase()
    // strip card/value date suffixes CommBank adds
    .replace(/\s+card\s+xx\d+.*/i, '')
    .replace(/\s+value date:.*/i, '')
    // strip common trailing noise
    .replace(/\b(pty|ltd|au|aus|act|nsw|vic|qld|wa|sa)\b/gi, '')
    .trim()
    .split(/\s+/)
    // drop pure-number tokens and single-char tokens
    .filter(w => w.length > 1 && !/^\d+$/.test(w))
    .slice(0, 2)
    .join(' ')
    .trim();
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

type SortField = 'date' | 'amount' | 'description';
type SortDir = 'asc' | 'desc';

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  accountId: string;
  type: 'all' | TransactionType;
  amtMin: string;
  amtMax: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  accountId: '',
  type: 'all',
  amtMin: '',
  amtMax: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtersActive(f: Filters): boolean {
  return (
    f.search !== '' ||
    f.dateFrom !== '' ||
    f.dateTo !== '' ||
    f.categoryId !== '' ||
    f.accountId !== '' ||
    f.type !== 'all' ||
    f.amtMin !== '' ||
    f.amtMax !== ''
  );
}

function exportCSV(txs: Transaction[], catMap: Record<string, string>, accMap: Record<string, string>) {
  const header = ['Date', 'Description', 'Category', 'Account', 'Amount', 'Type', 'Tags', 'Notes'];
  const rows = txs.map(t => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    catMap[t.categoryId] ?? t.categoryId,
    accMap[t.accountId] ?? t.accountId,
    t.amount.toFixed(2),
    t.type,
    `"${t.tags.join(', ')}"`,
    `"${t.notes.replace(/"/g, '""')}"`,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CategoryBadge ────────────────────────────────────────────────────────────

function CategoryBadge({ categoryId, categories }: { categoryId: string; categories: Category[] }) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}44` }}
    >
      {cat.name}
    </span>
  );
}

// ─── AddTransactionModal ──────────────────────────────────────────────────────

interface AddTxFormState {
  type: TransactionType;
  date: string;
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  tagsRaw: string;
  notes: string;
}

function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { accounts, categories, addTransaction } = useAppStore();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<AddTxFormState>({
    type: 'expense',
    date: today,
    description: '',
    amount: '',
    categoryId: categories[0]?.id ?? '',
    accountId: accounts[0]?.id ?? '',
    tagsRaw: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddTxFormState, string>>>({});

  function set<K extends keyof AddTxFormState>(k: K, v: AddTxFormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof AddTxFormState, string>> = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.date) e.date = 'Required';
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) e.amount = 'Enter a valid positive number';
    if (!form.categoryId) e.categoryId = 'Required';
    if (!form.accountId) e.accountId = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const rawAmt = parseFloat(form.amount);
    const signedAmt = form.type === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
    const tags = form.tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addTransaction({
      date: form.date,
      description: form.description.trim(),
      amount: signedAmt,
      categoryId: form.categoryId,
      accountId: form.accountId,
      type: form.type,
      tags,
      notes: form.notes.trim(),
      isRecurring: false,
    });
    onClose();
  }

  const inputCls =
    'bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full';
  const errCls = 'text-rose-400 text-xs mt-1';

  const filteredCategories = categories.filter(c =>
    form.type === 'income'
      ? c.type === 'income' || c.type === 'both'
      : c.type === 'expense' || c.type === 'both'
  );

  const [tagInput, setTagInput] = useState('');
  const tags = form.tagsRaw ? form.tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  function addTag(val: string) {
    const trimmed = val.replace(',', '').trim();
    if (!trimmed) return;
    const next = [...tags, trimmed].join(', ');
    set('tagsRaw', next);
    setTagInput('');
  }

  function removeTag(tag: string) {
    set('tagsRaw', tags.filter(t => t !== tag).join(', '));
  }

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-slate-400 text-xs mb-2 font-medium uppercase tracking-wide">Type</label>
        <div className="flex gap-2">
          {(['income', 'expense', 'transfer'] as TransactionType[]).map(t => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                form.type === t
                  ? t === 'income'
                    ? 'bg-emerald-500 text-white'
                    : t === 'expense'
                    ? 'bg-rose-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'bg-[#1a2744] text-slate-400 hover:text-white border border-[#1e2d45]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={inputCls + ' [color-scheme:dark]'}
          />
          {errors.date && <p className={errCls}>{errors.date}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            className={inputCls}
          />
          {errors.amount && <p className={errCls}>{errors.amount}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-slate-400 text-xs mb-1.5 font-medium">Description</label>
        <input
          type="text"
          placeholder="e.g. Coffee at Gloria Jean's"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          className={inputCls}
        />
        {errors.description && <p className={errCls}>{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">Category</label>
          <select
            value={form.categoryId}
            onChange={e => set('categoryId', e.target.value)}
            className={inputCls}
          >
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className={errCls}>{errors.categoryId}</p>}
        </div>

        {/* Account */}
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">Account</label>
          <select
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
            className={inputCls}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.accountId && <p className={errCls}>{errors.accountId}</p>}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-slate-400 text-xs mb-1.5 font-medium">Tags</label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Type a tag and press Enter or comma"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          onBlur={() => { if (tagInput) addTag(tagInput); }}
          className={inputCls}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-slate-400 text-xs mb-1.5 font-medium">Notes</label>
        <textarea
          placeholder="Optional notes…"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          className={inputCls + ' resize-none'}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Save Transaction
        </button>
      </div>
    </div>
  );
}

// ─── InlineEditRow ────────────────────────────────────────────────────────────

interface InlineEditProps {
  tx: Transaction;
  onSave: (changes: Partial<Transaction>) => void;
  onCancel: () => void;
  categories: Category[];
  accounts: { id: string; name: string; color: string }[];
}

function InlineEditRow({ tx, onSave, onCancel, categories, accounts }: InlineEditProps) {
  const [description, setDescription] = useState(tx.description);
  const [date, setDate] = useState(tx.date);
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [amount, setAmount] = useState(String(Math.abs(tx.amount)));
  const [notes, setNotes] = useState(tx.notes);
  const [tagsRaw, setTagsRaw] = useState(tx.tags.join(', '));

  function save() {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt)) return;
    const signedAmt = tx.type === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    onSave({ description, date, categoryId, amount: signedAmt, notes, tags });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') onCancel();
  }

  const inputCls =
    'bg-[#070c1b] border border-[#1e2d45] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors w-full';

  return (
    <tr className="bg-emerald-500/5 border-y border-emerald-500/20">
      <td className="px-4 py-2" />
      <td className="px-4 py-2">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputCls + ' [color-scheme:dark]'}
        />
      </td>
      <td className="px-4 py-2 min-w-[200px]">
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputCls}
          autoFocus
        />
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Notes…"
          className={inputCls + ' mt-1 text-slate-400'}
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className={inputCls}
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={tx.accountId}
          disabled
          className={inputCls + ' opacity-50 cursor-not-allowed'}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputCls + ' text-right'}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={tagsRaw}
          onChange={e => setTagsRaw(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="tag1, tag2"
          className={inputCls}
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-1.5">
          <button
            onClick={save}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white transition-colors"
            title="Save (Enter)"
          >
            <Check size={13} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 bg-[#1a2744] hover:bg-[#243355] rounded text-slate-400 hover:text-white transition-colors border border-[#1e2d45]"
            title="Cancel (Esc)"
          >
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Transactions Page ───────────────────────────────────────────────────

export default function Transactions() {
  const {
    transactions,
    categories,
    accounts,
    keywordOverrides,
    updateTransaction,
    deleteTransaction,
    bulkCategorize,
    bulkDelete,
    addKeywordOverride,
  } = useAppStore();

  // Filters
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal
  const [showAdd, setShowAdd] = useState(false);

  // Bulk categorize
  const [bulkCatId, setBulkCatId] = useState('');

  // Remember keyword prompt
  interface RememberPrompt { keyword: string; categoryId: string; }
  const [rememberPrompt, setRememberPrompt] = useState<RememberPrompt | null>(null);
  const [rememberSaved, setRememberSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category and account maps
  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.name])),
    [categories]
  );
  const accMap = useMemo(
    () => Object.fromEntries(accounts.map(a => [a.id, a.name])),
    [accounts]
  );

  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
    setSelectedIds(new Set());
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setSelectedIds(new Set());
  }

  // Active filter chips
  const filterChips: { key: keyof Filters; label: string }[] = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = [];
    if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` });
    if (filters.dateFrom) chips.push({ key: 'dateFrom', label: `From ${filters.dateFrom}` });
    if (filters.dateTo) chips.push({ key: 'dateTo', label: `To ${filters.dateTo}` });
    if (filters.categoryId) {
      const name = catMap[filters.categoryId] ?? filters.categoryId;
      chips.push({ key: 'categoryId', label: `Cat: ${name}` });
    }
    if (filters.accountId) {
      const name = accMap[filters.accountId] ?? filters.accountId;
      chips.push({ key: 'accountId', label: `Acc: ${name}` });
    }
    if (filters.type !== 'all') chips.push({ key: 'type', label: `Type: ${filters.type}` });
    if (filters.amtMin) chips.push({ key: 'amtMin', label: `Min $${filters.amtMin}` });
    if (filters.amtMax) chips.push({ key: 'amtMax', label: `Max $${filters.amtMax}` });
    return chips;
  }, [filters, catMap, accMap]);

  function dismissChip(key: keyof Filters) {
    setFilter(key, key === 'type' ? 'all' : '');
  }

  // Filtered + sorted transactions
  const filtered = useMemo(() => {
    let result = transactions;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(q));
    }
    if (filters.dateFrom) {
      result = result.filter(t => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(t => t.date <= filters.dateTo);
    }
    if (filters.categoryId) {
      result = result.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters.accountId) {
      result = result.filter(t => t.accountId === filters.accountId);
    }
    if (filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type);
    }
    const minAmt = parseFloat(filters.amtMin);
    if (!isNaN(minAmt)) {
      result = result.filter(t => Math.abs(t.amount) >= minAmt);
    }
    const maxAmt = parseFloat(filters.amtMax);
    if (!isNaN(maxAmt)) {
      result = result.filter(t => Math.abs(t.amount) <= maxAmt);
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = Math.abs(a.amount) - Math.abs(b.amount);
      else if (sortField === 'description') cmp = a.description.localeCompare(b.description);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTxs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-emerald-400" />
      : <ChevronDown size={13} className="text-emerald-400" />;
  }

  // Selection
  const allPageSelected =
    pageTxs.length > 0 && pageTxs.every(t => selectedIds.has(t.id));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds(s => {
        const next = new Set(s);
        pageTxs.forEach(t => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds(s => {
        const next = new Set(s);
        pageTxs.forEach(t => next.add(t.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Bulk actions
  function handleBulkCategorize() {
    if (!bulkCatId || selectedIds.size === 0) return;
    bulkCategorize(Array.from(selectedIds), bulkCatId);
    setBulkCatId('');
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;
    bulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  // Delete single
  const handleDelete = useCallback(
    (id: string) => {
      deleteTransaction(id);
      setDeletingId(null);
      setSelectedIds(s => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    },
    [deleteTransaction]
  );

  // Edit save — if category changed, offer to remember the keyword
  function handleEditSave(id: string, changes: Partial<Transaction>) {
    const original = transactions.find(t => t.id === id);
    updateTransaction(id, changes);
    setEditingId(null);

    if (changes.categoryId && original && changes.categoryId !== original.categoryId) {
      const desc = (changes.description as string | undefined) ?? original.description;
      const keyword = extractKeyword(desc);
      if (keyword && keyword.length > 1) {
        setRememberPrompt({ keyword, categoryId: changes.categoryId });
        setRememberSaved(false);
      }
    }
  }

  function handleRememberConfirm() {
    if (!rememberPrompt) return;
    addKeywordOverride(rememberPrompt.keyword, rememberPrompt.categoryId);
    setRememberSaved(true);
    setTimeout(() => { setRememberPrompt(null); setRememberSaved(false); }, 1500);
  }

  const hasFilters = filtersActive(filters);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filtered, catMap, accMap)}
            className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={15} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search description…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="bg-[#070c1b] border border-[#1e2d45] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            />
            {filters.search && (
              <button
                onClick={() => setFilter('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Date from */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilter('dateFrom', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            title="Date from"
          />

          {/* Date to */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilter('dateTo', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            title="Date to"
          />

          {/* Category */}
          <select
            value={filters.categoryId}
            onChange={e => setFilter('categoryId', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Account */}
          <select
            value={filters.accountId}
            onChange={e => setFilter('accountId', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Type */}
          <div className="flex gap-1">
            {(['all', 'income', 'expense', 'transfer'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter('type', t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filters.type === t
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#070c1b] border border-[#1e2d45] text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount range */}
          <input
            type="number"
            placeholder="Min $"
            min="0"
            step="0.01"
            value={filters.amtMin}
            onChange={e => setFilter('amtMin', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-24"
          />
          <input
            type="number"
            placeholder="Max $"
            min="0"
            step="0.01"
            value={filters.amtMax}
            onChange={e => setFilter('amtMax', e.target.value)}
            className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-24"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterChips.map(chip => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full text-xs"
              >
                {chip.label}
                <button
                  onClick={() => dismissChip(chip.key)}
                  className="hover:text-white ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#0d1526] border border-emerald-500/30 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-emerald-400 text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={bulkCatId}
              onChange={e => setBulkCatId(e.target.value)}
              className="bg-[#070c1b] border border-[#1e2d45] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Categorize as…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkCategorize}
              disabled={!bulkCatId}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
          >
            <Trash2 size={14} />
            Delete selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Deselect all
          </button>
          <button
            onClick={() => {
              const next = new Set<string>();
              filtered.forEach(t => next.add(t.id));
              setSelectedIds(next);
            }}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Select all ({filtered.length})
          </button>
        </div>
      )}

      {/* Table */}
      {transactions.length === 0 ? (
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl">
          <EmptyState
            icon={Tag}
            title="No transactions yet"
            description="Import your bank statement or add transactions manually to get started."
            action={
              <button
                onClick={() => setShowAdd(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add Transaction
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-white select-none whitespace-nowrap"
                    onClick={() => toggleSort('date')}
                  >
                    <span className="flex items-center gap-1">
                      Date <SortIcon field="date" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort('description')}
                  >
                    <span className="flex items-center gap-1">
                      Description <SortIcon field="description" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Account
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort('amount')}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Amount <SortIcon field="amount" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageTxs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  pageTxs.map(tx => {
                    if (editingId === tx.id) {
                      return (
                        <InlineEditRow
                          key={tx.id}
                          tx={tx}
                          categories={categories}
                          accounts={accounts}
                          onSave={changes => handleEditSave(tx.id, changes)}
                          onCancel={() => setEditingId(null)}
                        />
                      );
                    }

                    const acc = accounts.find(a => a.id === tx.accountId);
                    const isPositive = tx.amount >= 0;

                    return (
                      <tr
                        key={tx.id}
                        className={`border-b border-[#1e2d45]/60 hover:bg-[#1a2744]/40 transition-colors ${
                          selectedIds.has(tx.id) ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(tx.id)}
                            onChange={() => toggleSelect(tx.id)}
                            className="rounded accent-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                          {fmtDate(tx.date)}
                        </td>

                        {/* Description + notes */}
                        <td className="px-4 py-3 max-w-[260px]">
                          <p className="text-white text-sm truncate" title={tx.description}>
                            {tx.description}
                          </p>
                          {tx.notes && (
                            <p className="text-slate-500 text-xs mt-0.5 truncate" title={tx.notes}>
                              {tx.notes}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <CategoryBadge categoryId={tx.categoryId} categories={categories} />
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-slate-300 text-xs whitespace-nowrap">
                            {acc && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: acc.color }}
                              />
                            )}
                            {acc?.name ?? tx.accountId}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className={`px-4 py-3 text-right font-medium text-sm whitespace-nowrap ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : '-'}{fmtCurrency(Math.abs(tx.amount))}
                        </td>

                        {/* Tags */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tx.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 bg-[#1a2744] text-slate-400 border border-[#1e2d45] rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingId(tx.id)}
                              className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            {deletingId === tx.id ? (
                              <span className="flex items-center gap-1 ml-1">
                                <span className="text-xs text-rose-400">Delete?</span>
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                                >
                                  <X size={13} />
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeletingId(tx.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2d45]">
              <span className="text-slate-500 text-xs">
                Page {page} of {totalPages} &mdash; {filtered.length} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-[#1a2744] border border-[#1e2d45] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        page === p
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 hover:text-white bg-[#1a2744] border border-[#1e2d45]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-[#1a2744] border border-[#1e2d45] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input (unused but keeps ref valid) */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.txt" />

      {/* Add Transaction modal */}
      {showAdd && (
        <Modal title="Add Transaction" onClose={() => setShowAdd(false)} size="md">
          <AddTransactionModal onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {/* ── Remember keyword toast ───────────────────────────────────────────── */}
      {rememberPrompt && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d1526] border border-emerald-500/30 rounded-2xl shadow-2xl p-4 w-80 animate-in slide-in-from-bottom-4">
          {rememberSaved ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Check size={18} />
              <span className="font-medium text-sm">Saved! Future imports will auto-categorize this.</span>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
                  <Sparkles size={15} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Remember this categorization?</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Auto-categorize{' '}
                    <span className="text-white font-mono bg-[#1e2d45] px-1.5 py-0.5 rounded text-xs">
                      {rememberPrompt.keyword}
                    </span>{' '}
                    as{' '}
                    <span className="text-emerald-400">
                      {categories.find(c => c.id === rememberPrompt.categoryId)?.name ?? rememberPrompt.categoryId}
                    </span>{' '}
                    on future imports.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRememberConfirm}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                >
                  Yes, remember
                </button>
                <button
                  onClick={() => setRememberPrompt(null)}
                  className="flex-1 py-1.5 rounded-xl border border-[#1e2d45] text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Keyword overrides panel (collapsible, bottom of page) ─────────────── */}
      {Object.keys(keywordOverrides).length > 0 && (
        <KeywordOverridesPanel
          keywordOverrides={keywordOverrides}
          categories={categories}
        />
      )}
    </div>
  );
}

// ─── KeywordOverridesPanel ────────────────────────────────────────────────────

function KeywordOverridesPanel({
  keywordOverrides,
  categories,
}: {
  keywordOverrides: Record<string, string>;
  categories: Category[];
}) {
  const { addKeywordOverride } = useAppStore();
  const [open, setOpen] = useState(false);

  function removeOverride(keyword: string) {
    // Set to empty string to effectively disable (store will ignore blank categoryId)
    addKeywordOverride(keyword, '');
  }

  const active = Object.entries(keywordOverrides).filter(([, v]) => v !== '');

  if (!active.length) return null;

  return (
    <div className="mt-4 bg-[#0d1526] border border-[#1e2d45] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#1e2d45]/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">
            Smart Rules ({active.length})
          </span>
          <span className="text-xs text-slate-500">— keyword → category mappings</span>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-[#1e2d45] px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {active.map(([keyword, catId]) => {
              const cat = categories.find(c => c.id === catId);
              return (
                <div
                  key={keyword}
                  className="flex items-center gap-1.5 bg-[#1e2d45] rounded-full px-3 py-1 text-xs"
                >
                  <span className="font-mono text-white">{keyword}</span>
                  <span className="text-slate-500">→</span>
                  {cat && (
                    <span style={{ color: cat.color }}>{cat.name}</span>
                  )}
                  <button
                    onClick={() => removeOverride(keyword)}
                    className="text-slate-500 hover:text-rose-400 ml-0.5 transition-colors"
                    title="Remove rule"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            These rules apply automatically when importing CSV files. Remove any rule to stop using it.
          </p>
        </div>
      )}
    </div>
  );
}
