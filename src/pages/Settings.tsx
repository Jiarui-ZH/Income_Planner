import { useState, useRef, useMemo } from 'react';
import {
  Save, Download, Upload, Trash2, Lock, Plus, X, Check,
  ChevronDown, AlertTriangle, Database, Edit2, LogOut,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import Modal from '../components/Modal';
import { fmtCurrency } from '../utils/helpers';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { supabase } from '../lib/supabase';
import type { Category, Account, AccountType } from '../types';

// ── Australian tax helpers ─────────────────────────────────────────────────────

function calcIncomeTax(gross: number): number {
  if (gross <= 18200)  return 0;
  if (gross <= 45000)  return (gross - 18200) * 0.19;
  if (gross <= 120000) return 5092 + (gross - 45000) * 0.325;
  if (gross <= 180000) return 29467 + (gross - 120000) * 0.37;
  return 51667 + (gross - 180000) * 0.45;
}

function calcLITO(gross: number): number {
  if (gross <= 37500)  return 700;
  if (gross <= 45000)  return 700 - (gross - 37500) * 0.05;
  if (gross <= 66667)  return 325 - (gross - 45000) * 0.015;
  return 0;
}

function calcMedicare(gross: number): number {
  return gross * 0.02;
}

interface TaxBreakdown {
  gross: number;
  incomeTax: number;
  lito: number;
  medicare: number;
  superContribution: number;
  netAnnual: number;
  netMonthly: number;
  netFortnightly: number;
  netWeekly: number;
}

function computeTaxBreakdown(gross: number, superRate: number): TaxBreakdown {
  const incomeTax = calcIncomeTax(gross);
  const lito = calcLITO(gross);
  const medicare = calcMedicare(gross);
  const superContribution = gross * (superRate / 100);
  const netAnnual = gross - incomeTax + lito - medicare;
  return {
    gross,
    incomeTax,
    lito,
    medicare,
    superContribution,
    netAnnual,
    netMonthly: netAnnual / 12,
    netFortnightly: netAnnual / 26,
    netWeekly: netAnnual / 52,
  };
}

// ── icon picker (static list of Lucide icon names) ────────────────────────────

const ICON_OPTIONS = [
  'DollarSign', 'Banknote', 'Briefcase', 'TrendingUp', 'ShoppingCart', 'Car',
  'HeartPulse', 'Tv', 'RefreshCw', 'ShoppingBag', 'Zap', 'Home', 'Shield',
  'GraduationCap', 'Plane', 'Sparkles', 'PiggyBank', 'BarChart2', 'UtensilsCrossed',
  'MoreHorizontal', 'Coffee', 'Music', 'Gamepad2', 'Baby', 'Dumbbell', 'BookOpen',
  'Wifi', 'Phone', 'Gift', 'Wrench', 'Star', 'Heart', 'Smile',
];

const COLOR_OPTIONS = [
  '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#f97316', '#fb923c',
  '#3b82f6', '#60a5fa', '#ef4444', '#f87171', '#8b5cf6', '#a78bfa',
  '#ec4899', '#f472b6', '#eab308', '#fbbf24', '#06b6d4', '#22d3ee',
  '#94a3b8', '#64748b', '#f59e0b', '#d97706', '#4ade80', '#86efac',
];

// ── shared input styles ────────────────────────────────────────────────────────

const inputCls = 'bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full';
const labelCls = 'block text-slate-400 text-xs mb-1';
const cardCls  = 'bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 w-full';

// ── sub-tabs ──────────────────────────────────────────────────────────────────

type Tab = 'general' | 'income' | 'categories' | 'accounts' | 'data';

// ── General tab ──────────────────────────────────────────────────────────────

function GeneralTab() {
  const { settings, updateSettings } = useAppStore();
  const [currency, setCurrency]   = useState(settings.currency);
  const [symbol, setSymbol]       = useState(settings.currencySymbol);
  const [payCycle, setPayCycle]   = useState(settings.payCycle);
  const [payDay, setPayDay]       = useState(settings.payDay);
  const [theme, setTheme]         = useState<'dark' | 'light'>(settings.theme ?? 'dark');
  const [saved, setSaved]         = useState(false);

  const CURRENCIES = [
    { code: 'AUD', sym: '$', label: 'AUD — Australian Dollar' },
    { code: 'USD', sym: '$', label: 'USD — US Dollar' },
    { code: 'EUR', sym: '€', label: 'EUR — Euro' },
    { code: 'GBP', sym: '£', label: 'GBP — British Pound' },
    { code: 'NZD', sym: '$', label: 'NZD — New Zealand Dollar' },
    { code: 'CAD', sym: '$', label: 'CAD — Canadian Dollar' },
    { code: 'SGD', sym: '$', label: 'SGD — Singapore Dollar' },
    { code: 'JPY', sym: '¥', label: 'JPY — Japanese Yen' },
  ];

  function handleCurrencyChange(code: string) {
    setCurrency(code);
    const found = CURRENCIES.find(c => c.code === code);
    if (found) setSymbol(found.sym);
  }

  function handleSave() {
    updateSettings({ currency, currencySymbol: symbol, payCycle, payDay, theme });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const maxPayDay = payCycle === 'monthly' ? 31 : 7;

  return (
    <div className="space-y-5 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Currency */}
        <div className={cardCls}>
          <h3 className="text-white font-medium mb-4">Currency</h3>
          <label className={labelCls}>Currency</label>
          <div className="relative">
            <select
              className={inputCls + ' appearance-none pr-8'}
              value={currency}
              onChange={e => handleCurrencyChange(e.target.value)}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Pay Cycle */}
        <div className={cardCls}>
          <h3 className="text-white font-medium mb-4">Pay Cycle</h3>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Pay frequency</label>
              <div className="flex gap-2">
                {(['weekly', 'fortnightly', 'monthly'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setPayCycle(c)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      payCycle === c
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#1a2744] text-slate-400 hover:text-white border border-[#1e2d45]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>
                Pay day {payCycle === 'monthly' ? '(1–31)' : payCycle === 'weekly' ? '(1 = Mon, 7 = Sun)' : '(1–14)'}
              </label>
              <input
                type="number"
                className={inputCls}
                min={1}
                max={maxPayDay}
                value={payDay}
                onChange={e => setPayDay(Math.min(maxPayDay, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className={cardCls}>
          <h3 className="text-white font-medium mb-4">Theme</h3>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#1a2744] text-slate-400 hover:text-white border border-[#1e2d45]'
                }`}
              >
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-2">Save settings to apply the theme change.</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Income & Super tab ────────────────────────────────────────────────────────

function IncomeTab() {
  const { settings, updateSettings } = useAppStore();
  const sym = settings.currencySymbol;

  const [packageAmount, setPackageAmount] = useState(settings.annualGrossIncome);
  const [superRate, setSuperRate]         = useState(settings.superRate);
  // true = the number entered already includes super (total package)
  // false = super is paid on top of the entered amount (base salary)
  const [superIncluded, setSuperIncluded] = useState(false);
  const [netMonthly, setNetMonthly]       = useState(settings.monthlyNetIncome);
  const [saved, setSaved]                 = useState(false);

  // Super INCLUDED (toggle ON):
  //   super = package × rate%  →  taxable = package − super
  //   e.g. $90k @ 11.5%: super = $10,350 → taxable = $79,650 → tax brackets on $79,650
  //
  // Super NOT included (toggle OFF):
  //   Entered figure IS the taxable income; employer pays super on top separately.
  //   e.g. $90k base: taxable = $90k (super doesn't reduce your take-home)
  const superAmount = useMemo(
    () => packageAmount * (superRate / 100),
    [packageAmount, superRate],
  );

  const taxableGross = useMemo(() => {
    if (superIncluded) return packageAmount - superAmount;
    return packageAmount;
  }, [packageAmount, superAmount, superIncluded]);

  const breakdown = useMemo(
    () => computeTaxBreakdown(taxableGross, superRate),
    [taxableGross, superRate],
  );

  function handleSave() {
    updateSettings({
      annualGrossIncome: packageAmount,
      superRate,
      monthlyNetIncome: netMonthly,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const rows: { label: string; value: string; positive?: boolean; negative?: boolean }[] = [
    { label: superIncluded ? `Package (incl. super)` : 'Base Salary',
                                     value: fmtCurrency(packageAmount, sym) },
    ...(superIncluded ? [{ label: `Super deducted (${superRate}%)`, value: `−${fmtCurrency(superAmount, sym)}`, negative: true as const }] : []),
    { label: 'Taxable Income',       value: fmtCurrency(taxableGross, sym) },
    { label: 'Income Tax',           value: `−${fmtCurrency(breakdown.incomeTax, sym)}`,  negative: true },
    { label: 'LITO Offset',          value: `+${fmtCurrency(breakdown.lito, sym)}`,        positive: true },
    { label: 'Medicare Levy (2%)',   value: `−${fmtCurrency(breakdown.medicare, sym)}`,   negative: true },
    ...(!superIncluded ? [{ label: `Super paid by employer (${superRate}%)`, value: fmtCurrency(superAmount, sym) }] : []),
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
      <div className={cardCls}>
        <h3 className="text-white font-medium mb-4">Income</h3>
        <div className="space-y-5 w-full">

          {/* Annual income input */}
          <div>
            <label className={labelCls}>
              Annual {superIncluded ? 'Total Package (super included)' : 'Base Salary (super on top)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                min={0}
                step={1000}
                value={packageAmount}
                onChange={e => setPackageAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Super-included toggle */}
          <div className="bg-[#1a2744] border border-[#1e2d45] rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm text-white font-medium">Super included in this figure?</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {superIncluded
                    ? `${fmtCurrency(packageAmount, sym)} − ${fmtCurrency(superAmount, sym)} super (${superRate}%) = ${fmtCurrency(taxableGross, sym)} taxable income`
                    : `${fmtCurrency(packageAmount, sym)} is your taxable income — employer pays ${fmtCurrency(superAmount, sym)} super on top`}
                </p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={superIncluded}
                onClick={() => setSuperIncluded(v => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 ml-4 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${superIncluded ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${superIncluded ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>

          {/* Super rate slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Superannuation Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={superRate}
                  onChange={e => setSuperRate(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#070c1b] border border-[#1e2d45] rounded-lg px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-sm">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={superRate}
              onChange={e => setSuperRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0%</span>
              <span className="text-slate-500">ATO minimum: 11.5% (2024–25)</span>
              <span>20%</span>
            </div>
          </div>

          {/* Monthly net override */}
          <div>
            <label className={labelCls}>Monthly Net Income (override)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                min={0}
                step={100}
                value={netMonthly}
                onChange={e => setNetMonthly(parseFloat(e.target.value) || 0)}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Estimated: {fmtCurrency(breakdown.netMonthly, sym)}/mo — override if your actual take-home differs.
            </p>
          </div>
        </div>
      </div>

      {/* Tax breakdown card */}
      <div className={cardCls}>
        <h3 className="text-white font-medium mb-4">Australian Tax Breakdown (2024–25)</h3>
        <div className="space-y-2 mb-4">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#1e2d45] last:border-0">
              <span className="text-slate-400 text-sm">{r.label}</span>
              <span className={`text-sm font-medium ${r.positive ? 'text-emerald-400' : r.negative ? 'text-rose-400' : 'text-white'}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-[#1a2744] rounded-lg p-4 border border-[#1e2d45]">
          <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-wide">Net Take-Home</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Annual',      value: fmtCurrency(breakdown.netAnnual, sym) },
              { label: 'Monthly',     value: fmtCurrency(breakdown.netMonthly, sym) },
              { label: 'Fortnightly', value: fmtCurrency(breakdown.netFortnightly, sym) },
              { label: 'Weekly',      value: fmtCurrency(breakdown.netWeekly, sym) },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-emerald-400 text-base font-bold">{item.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>{/* end grid */}

      <button
        onClick={handleSave}
        className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Categories tab ────────────────────────────────────────────────────────────

interface NewCategoryForm {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  keywords: string;
}

function CategoriesTab() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useAppStore();
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editKeywords, setEditKeywords] = useState('');
  const [newKeyword, setNewKeyword]   = useState('');
  const [showAddCat, setShowAddCat]   = useState(false);
  const [newCat, setNewCat]           = useState<NewCategoryForm>({
    name: '', icon: 'Star', color: '#10b981', type: 'expense', keywords: '',
  });
  const [mergeSourceId, setMergeSourceId]   = useState('');
  const [mergeTargetId, setMergeTargetId]   = useState('');
  const [mergeDone, setMergeDone]           = useState(false);
  const { updateTransaction } = useAppStore();

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditKeywords(cat.keywords.join(', '));
    setNewKeyword('');
  }

  function saveKeywords(id: string) {
    const kws = editKeywords.split(',').map(k => k.trim()).filter(Boolean);
    updateCategory(id, { keywords: kws });
    setEditingId(null);
  }

  function addNewCat() {
    if (!newCat.name.trim()) return;
    const kws = newCat.keywords.split(',').map(k => k.trim()).filter(Boolean);
    addCategory({
      name: newCat.name.trim(),
      icon: newCat.icon,
      color: newCat.color,
      type: newCat.type,
      keywords: kws,
      isDefault: false,
    });
    setNewCat({ name: '', icon: 'Star', color: '#10b981', type: 'expense', keywords: '' });
    setShowAddCat(false);
  }

  function handleMerge() {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return;
    // Update all transactions pointing to source → target
    transactions
      .filter(t => t.categoryId === mergeSourceId)
      .forEach(t => updateTransaction(t.id, { categoryId: mergeTargetId }));
    // Delete source
    const srcCat = categories.find(c => c.id === mergeSourceId);
    if (srcCat && !srcCat.isDefault) {
      deleteCategory(mergeSourceId);
    }
    setMergeSourceId('');
    setMergeTargetId('');
    setMergeDone(true);
    setTimeout(() => setMergeDone(false), 2500);
  }

  const txCountByCat: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of transactions) {
      m[t.categoryId] = (m[t.categoryId] ?? 0) + 1;
    }
    return m;
  }, [transactions]);

  return (
    <div className="space-y-5 w-full">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">All Categories</h3>
          <button
            onClick={() => setShowAddCat(v => !v)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus size={13} />
            New Category
          </button>
        </div>

        {/* Add new category form */}
        {showAddCat && (
          <div className="bg-[#1a2744] border border-[#1e2d45] rounded-xl p-4 mb-4 space-y-3">
            <h4 className="text-white text-sm font-medium">New Category</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Hobbies"
                  value={newCat.name}
                  onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <div className="relative">
                  <select
                    className={inputCls + ' appearance-none pr-8'}
                    value={newCat.type}
                    onChange={e => setNewCat(p => ({ ...p, type: e.target.value as NewCategoryForm['type'] }))}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="both">Both</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Icon</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {ICON_OPTIONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewCat(p => ({ ...p, icon: ic }))}
                    title={ic}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      newCat.icon === ic
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-[#0d1526] text-slate-400 border-[#1e2d45] hover:border-emerald-500/50'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCat(p => ({ ...p, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      newCat.color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Keywords (comma separated)</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. hobby, craft, lego"
                value={newCat.keywords}
                onChange={e => setNewCat(p => ({ ...p, keywords: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddCat(false)}
                className="bg-[#1a2744] hover:bg-[#243355] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-[#1e2d45]"
              >
                Cancel
              </button>
              <button
                onClick={addNewCat}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        )}

        {/* Category list */}
        <div className="space-y-1">
          {categories.map(cat => {
            const isEditing = editingId === cat.id;
            const defaultCat = DEFAULT_CATEGORIES.find(d => d.id === cat.id);
            const txCount = txCountByCat[cat.id] ?? 0;

            return (
              <div
                key={cat.id}
                className="border border-[#1e2d45] rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: cat.color }}
                  />
                  {/* Name + badges */}
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium truncate">{cat.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                      cat.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : cat.type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-[#1a2744] text-slate-400 border-[#1e2d45]'
                    }`}>
                      {cat.type}
                    </span>
                    <span className="text-slate-500 text-xs">{cat.keywords.length} keywords</span>
                    <span className="text-slate-500 text-xs">{txCount} txns</span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveKeywords(cat.id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors text-xs px-2"
                          title="Edit keywords"
                        >
                          Keywords
                        </button>
                        {cat.isDefault ? (
                          <span className="p-1.5 text-slate-600" title="Default category — cannot delete">
                            <Lock size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Keyword editor */}
                {isEditing && (
                  <div className="border-t border-[#1e2d45] px-3 py-3 bg-[#0a1020]/50">
                    <label className="text-slate-400 text-xs mb-1.5 block">
                      Keywords (comma separated) — used for auto-categorisation
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className={inputCls + ' flex-1'}
                        value={editKeywords}
                        onChange={e => setEditKeywords(e.target.value)}
                        placeholder="netflix, spotify, subscription…"
                      />
                      <input
                        type="text"
                        className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-36"
                        placeholder="Add keyword"
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newKeyword.trim()) {
                            const kws = editKeywords ? editKeywords + ', ' + newKeyword.trim() : newKeyword.trim();
                            setEditKeywords(kws);
                            setNewKeyword('');
                          }
                        }}
                      />
                    </div>
                    {defaultCat && (
                      <p className="text-slate-500 text-xs mt-1.5">
                        Default keywords will be used if none are set.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Merge categories */}
      <div className={cardCls}>
        <h3 className="text-white font-medium mb-4">Merge Categories</h3>
        <p className="text-slate-400 text-sm mb-4">
          Move all transactions from one category into another, then remove the source category.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>Source (to remove)</label>
            <div className="relative">
              <select
                className={inputCls + ' appearance-none pr-8'}
                value={mergeSourceId}
                onChange={e => setMergeSourceId(e.target.value)}
              >
                <option value="">Select category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Target (to keep)</label>
            <div className="relative">
              <select
                className={inputCls + ' appearance-none pr-8'}
                value={mergeTargetId}
                onChange={e => setMergeTargetId(e.target.value)}
              >
                <option value="">Select category…</option>
                {categories.filter(c => c.id !== mergeSourceId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <button
          onClick={handleMerge}
          disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {mergeDone ? <Check size={15} className="text-emerald-400" /> : null}
          {mergeDone ? 'Merged!' : 'Merge Categories'}
        </button>
      </div>
    </div>
  );
}

// ── Accounts tab ──────────────────────────────────────────────────────────────

interface AccountFormData {
  name: string;
  type: AccountType;
  institution: string;
  initialBalance: string;
  color: string;
  isActive: boolean;
}

function blankAccountForm(): AccountFormData {
  return { name: '', type: 'checking', institution: '', initialBalance: '0', color: '#10b981', isActive: true };
}

function accountFormFromAccount(a: Account): AccountFormData {
  return {
    name: a.name,
    type: a.type,
    institution: a.institution ?? '',
    initialBalance: String(a.initialBalance),
    color: a.color,
    isActive: a.isActive,
  };
}

function AccountsTab() {
  const { accounts, addAccount, updateAccount, deleteAccount, settings } = useAppStore();
  const sym = settings.currencySymbol;

  const [editingId, setEditingId]       = useState<string | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState<AccountFormData>(blankAccountForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'investment'];
  const TYPE_LABELS: Record<AccountType, string> = {
    checking: 'Checking', savings: 'Savings', credit: 'Credit', investment: 'Investment',
  };

  function openEdit(acc: Account) {
    setEditingId(acc.id);
    setForm(accountFormFromAccount(acc));
    setShowAdd(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm(blankAccountForm());
    setShowAdd(true);
  }

  function handleSave() {
    const balance = parseFloat(form.initialBalance) || 0;
    const data = {
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim() || undefined,
      initialBalance: balance,
      color: form.color,
      isActive: form.isActive,
    };
    if (editingId) {
      updateAccount(editingId, data);
      setEditingId(null);
    } else {
      addAccount(data);
      setShowAdd(false);
    }
    setForm(blankAccountForm());
  }

  function handleDelete(id: string) {
    deleteAccount(id);
    setDeleteConfirmId(null);
  }

  const typeBadgeCls: Record<AccountType, string> = {
    checking:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
    savings:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    credit:     'bg-rose-500/10 text-rose-400 border-rose-500/30',
    investment: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const AccountFormFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Account Name</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. CommBank Everyday"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <div className="relative">
            <select
              className={inputCls + ' appearance-none pr-8'}
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as AccountType }))}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Institution</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Commonwealth Bank"
            value={form.institution}
            onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Initial Balance</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
            <input
              type="number"
              className={inputCls + ' pl-6'}
              step="0.01"
              value={form.initialBalance}
              onChange={e => setForm(p => ({ ...p, initialBalance: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.slice(0, 12).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(p => ({ ...p, color: c }))}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                form.color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Active</span>
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.isActive ? 'bg-emerald-500' : 'bg-[#1a2744] border border-[#1e2d45]'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            form.isActive ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setEditingId(null); setShowAdd(false); setForm(blankAccountForm()); }}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-[#1e2d45]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {editingId ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 w-full">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Accounts</h3>
          <button
            onClick={openAdd}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus size={13} />
            Add Account
          </button>
        </div>

        {showAdd && (
          <div className="bg-[#1a2744] border border-[#1e2d45] rounded-xl p-4 mb-4">
            <h4 className="text-white text-sm font-medium mb-3">New Account</h4>
            {AccountFormFields}
          </div>
        )}

        <div className="space-y-2">
          {accounts.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No accounts yet. Add one to get started.</p>
          )}
          {accounts.map(acc => (
            <div key={acc.id} className="border border-[#1e2d45] rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: acc.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{acc.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${typeBadgeCls[acc.type]}`}>
                      {TYPE_LABELS[acc.type]}
                    </span>
                    {!acc.isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border bg-[#1a2744] text-slate-500 border-[#1e2d45]">
                        Inactive
                      </span>
                    )}
                  </div>
                  {acc.institution && (
                    <p className="text-slate-500 text-xs mt-0.5">{acc.institution}</p>
                  )}
                </div>
                <span className="text-slate-300 text-sm font-medium">
                  {fmtCurrency(acc.initialBalance, sym)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(acc)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editingId === acc.id && (
                <div className="border-t border-[#1e2d45] px-3 py-3 bg-[#0a1020]/50">
                  {AccountFormFields}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {deleteConfirmId && (
        <Modal
          title="Delete Account"
          onClose={() => setDeleteConfirmId(null)}
          size="sm"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-amber-500/10 p-2 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-amber-400" />
            </div>
            <p className="text-slate-300 text-sm">
              This will remove the account from your list. Existing transactions linked to this account will not be deleted.
            </p>
          </div>
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

// ── Data tab ──────────────────────────────────────────────────────────────────

function DataTab() {
  const { transactions, importBatches, exportData, importData, clearAllData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClearConfirm, setShowClearConfirm]     = useState(false);
  const [clearText, setClearText]                   = useState('');
  const [showImportConfirm, setShowImportConfirm]   = useState(false);
  const [pendingImportJson, setPendingImportJson]   = useState<string | null>(null);
  const [importError, setImportError]               = useState<string | null>(null);
  const [exportDone, setExportDone]                 = useState(false);

  const storageSize = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) total += (localStorage.getItem(k) ?? '').length;
      }
      const kb = (total * 2) / 1024;
      return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
    } catch {
      return 'Unknown';
    }
  }, [transactions, importBatches]);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      try {
        JSON.parse(text); // validate
        setPendingImportJson(text);
        setShowImportConfirm(true);
      } catch {
        setImportError('Invalid JSON file. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function confirmImport() {
    if (pendingImportJson) {
      importData(pendingImportJson);
    }
    setPendingImportJson(null);
    setShowImportConfirm(false);
  }

  function handleClearAll() {
    if (clearText.trim().toUpperCase() === 'DELETE') {
      clearAllData();
      setShowClearConfirm(false);
      setClearText('');
    }
  }

  return (
    <div className="space-y-5 w-full">
      {/* Storage info */}
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <Database size={18} className="text-blue-400" />
          </div>
          <h3 className="text-white font-medium">Storage</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-xs">Storage Used</p>
            <p className="text-white font-semibold mt-0.5">{storageSize}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Transactions</p>
            <p className="text-white font-semibold mt-0.5">{transactions.length.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Import Batches</p>
            <p className="text-white font-semibold mt-0.5">{importBatches.length}</p>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} from {importBatches.length} import batch{importBatches.length !== 1 ? 'es' : ''}.
        </p>
      </div>

      {/* Export */}
      <div className={cardCls}>
        <h3 className="text-white font-medium mb-2">Export Backup</h3>
        <p className="text-slate-400 text-sm mb-4">
          Download all your data as a JSON file. Use this to back up or transfer your data.
        </p>
        <button
          onClick={handleExport}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2"
        >
          {exportDone ? <Check size={15} className="text-emerald-400" /> : <Download size={15} />}
          {exportDone ? 'Downloaded!' : 'Export as JSON'}
        </button>
      </div>

      {/* Import */}
      <div className={cardCls}>
        <h3 className="text-white font-medium mb-2">Import Backup</h3>
        <p className="text-slate-400 text-sm mb-4">
          Restore data from a previously exported JSON backup. This will replace all current data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        {importError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-400 shrink-0" />
            <p className="text-rose-400 text-sm">{importError}</p>
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2"
        >
          <Upload size={15} />
          Choose Backup File
        </button>
      </div>

      {/* Clear all data */}
      <div className={cardCls + ' border-rose-500/20'}>
        <h3 className="text-white font-medium mb-2">Clear All Data</h3>
        <p className="text-slate-400 text-sm mb-4">
          Permanently delete all transactions, accounts, and settings. This resets the app to its demo state and cannot be undone.
        </p>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Trash2 size={15} />
          Clear All Data
        </button>
      </div>

      {/* Import confirm modal */}
      {showImportConfirm && (
        <Modal title="Confirm Import" onClose={() => { setShowImportConfirm(false); setPendingImportJson(null); }} size="sm">
          <div className="flex items-start gap-3 mb-5">
            <div className="bg-amber-500/10 p-2 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-amber-400" />
            </div>
            <p className="text-slate-300 text-sm">
              Importing this backup will replace <strong className="text-white">all</strong> your current data including transactions, accounts, categories, and settings. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowImportConfirm(false); setPendingImportJson(null); }}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
            >
              Cancel
            </button>
            <button
              onClick={confirmImport}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
            >
              Import & Replace
            </button>
          </div>
        </Modal>
      )}

      {/* Clear all confirm modal */}
      {showClearConfirm && (
        <Modal title="Clear All Data" onClose={() => { setShowClearConfirm(false); setClearText(''); }} size="sm">
          <div className="flex items-start gap-3 mb-5">
            <div className="bg-rose-500/10 p-2 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-rose-400" />
            </div>
            <p className="text-slate-300 text-sm">
              This will permanently delete all {transactions.length} transactions and reset the app. Type <strong className="text-white">DELETE</strong> to confirm.
            </p>
          </div>
          <input
            type="text"
            className={inputCls + ' mb-4'}
            placeholder="Type DELETE to confirm"
            value={clearText}
            onChange={e => setClearText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setShowClearConfirm(false); setClearText(''); }}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearText.trim().toUpperCase() !== 'DELETE'}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All Data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Root Settings page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',    label: 'General' },
  { id: 'income',     label: 'Income & Super' },
  { id: 'categories', label: 'Categories' },
  { id: 'accounts',   label: 'Accounts' },
  { id: 'data',       label: 'Data' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your preferences, categories, accounts, and data.</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 px-4 py-2 border border-[#1e2d45] text-slate-400 hover:text-white hover:border-[#2a3d5a] text-sm transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a2744]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general'    && <GeneralTab />}
          {activeTab === 'income'     && <IncomeTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'accounts'   && <AccountsTab />}
          {activeTab === 'data'       && <DataTab />}
        </div>
      </div>
    </div>
  );
}
