import { useState, useCallback } from 'react';
import type {
  AppState, Transaction, Category, Account, BudgetBucket,
  SavingsGoal, RecurringItem, ImportBatch, AppSettings,
  IncomeAllocation, TransactionSplit,
} from '../types';
import { SEED_STATE } from '../utils/seedData';
import { nanoid } from '../utils/helpers';

const STORAGE_KEY = 'ultimate_finance_v3';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Merge any new default categories that might have been added
      return parsed;
    }
  } catch { /* ignore */ }
  return SEED_STATE;
}

function saveState(state: AppState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // ── Transactions ───────────────────────────────────────────────────────────

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: 'tx_' + nanoid() };
    update(s => ({
      ...s,
      transactions: [newTx, ...s.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, [update]);

  const addTransactions = useCallback((txs: Omit<Transaction, 'id'>[], batchId: string) => {
    const newTxs = txs.map(tx => ({ ...tx, id: 'tx_' + nanoid(), importBatchId: batchId }));
    update(s => ({
      ...s,
      transactions: [...newTxs, ...s.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, [update]);

  const updateTransaction = useCallback((id: string, changes: Partial<Transaction>) => {
    update(s => ({
      ...s,
      transactions: s.transactions.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, [update]);

  const deleteTransaction = useCallback((id: string) => {
    update(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
  }, [update]);

  const bulkCategorize = useCallback((ids: string[], categoryId: string) => {
    update(s => ({
      ...s,
      transactions: s.transactions.map(t => ids.includes(t.id) ? { ...t, categoryId } : t),
    }));
  }, [update]);

  const bulkDelete = useCallback((ids: string[]) => {
    update(s => ({ ...s, transactions: s.transactions.filter(t => !ids.includes(t.id)) }));
  }, [update]);

  const splitTransaction = useCallback((id: string, splits: TransactionSplit[]) => {
    update(s => ({
      ...s,
      transactions: s.transactions.map(t => t.id === id ? { ...t, splits } : t),
    }));
  }, [update]);

  // ── Categories ─────────────────────────────────────────────────────────────

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: 'cat_' + nanoid() };
    update(s => ({ ...s, categories: [...s.categories, newCat] }));
  }, [update]);

  const updateCategory = useCallback((id: string, changes: Partial<Category>) => {
    update(s => ({
      ...s,
      categories: s.categories.map(c => c.id === id ? { ...c, ...changes } : c),
    }));
  }, [update]);

  const deleteCategory = useCallback((id: string) => {
    update(s => ({
      ...s,
      categories: s.categories.filter(c => c.id !== id),
      transactions: s.transactions.map(t =>
        t.categoryId === id ? { ...t, categoryId: 'cat_other' } : t
      ),
    }));
  }, [update]);

  // ── Accounts ───────────────────────────────────────────────────────────────

  const addAccount = useCallback((acc: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...acc, id: 'acc_' + nanoid() };
    update(s => ({ ...s, accounts: [...s.accounts, newAcc] }));
  }, [update]);

  const updateAccount = useCallback((id: string, changes: Partial<Account>) => {
    update(s => ({
      ...s,
      accounts: s.accounts.map(a => a.id === id ? { ...a, ...changes } : a),
    }));
  }, [update]);

  const deleteAccount = useCallback((id: string) => {
    update(s => ({ ...s, accounts: s.accounts.filter(a => a.id !== id) }));
  }, [update]);

  // ── Budget Buckets ─────────────────────────────────────────────────────────

  const addBudgetBucket = useCallback((bucket: Omit<BudgetBucket, 'id'>) => {
    const newBucket: BudgetBucket = { ...bucket, id: 'bucket_' + nanoid() };
    update(s => ({ ...s, budgetBuckets: [...s.budgetBuckets, newBucket] }));
  }, [update]);

  const updateBudgetBucket = useCallback((id: string, changes: Partial<BudgetBucket>) => {
    update(s => ({
      ...s,
      budgetBuckets: s.budgetBuckets.map(b => b.id === id ? { ...b, ...changes } : b),
    }));
  }, [update]);

  const deleteBudgetBucket = useCallback((id: string) => {
    update(s => ({ ...s, budgetBuckets: s.budgetBuckets.filter(b => b.id !== id) }));
  }, [update]);

  // ── Income Allocation ──────────────────────────────────────────────────────

  const updateIncomeAllocation = useCallback((allocation: IncomeAllocation) => {
    update(s => ({ ...s, incomeAllocation: allocation }));
  }, [update]);

  // ── Savings Goals ──────────────────────────────────────────────────────────

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = { ...goal, id: 'goal_' + nanoid(), createdAt: new Date().toISOString() };
    update(s => ({ ...s, savingsGoals: [...s.savingsGoals, newGoal] }));
  }, [update]);

  const updateSavingsGoal = useCallback((id: string, changes: Partial<SavingsGoal>) => {
    update(s => ({
      ...s,
      savingsGoals: s.savingsGoals.map(g => g.id === id ? { ...g, ...changes } : g),
    }));
  }, [update]);

  const deleteSavingsGoal = useCallback((id: string) => {
    update(s => ({ ...s, savingsGoals: s.savingsGoals.filter(g => g.id !== id) }));
  }, [update]);

  // ── Recurring Items ────────────────────────────────────────────────────────

  const addRecurringItem = useCallback((item: Omit<RecurringItem, 'id'>) => {
    const newItem: RecurringItem = { ...item, id: 'rec_' + nanoid() };
    update(s => ({ ...s, recurringItems: [...s.recurringItems, newItem] }));
  }, [update]);

  const updateRecurringItem = useCallback((id: string, changes: Partial<RecurringItem>) => {
    update(s => ({
      ...s,
      recurringItems: s.recurringItems.map(r => r.id === id ? { ...r, ...changes } : r),
    }));
  }, [update]);

  const deleteRecurringItem = useCallback((id: string) => {
    update(s => ({ ...s, recurringItems: s.recurringItems.filter(r => r.id !== id) }));
  }, [update]);

  // ── Import Batches ─────────────────────────────────────────────────────────

  const addImportBatch = useCallback((batch: ImportBatch) => {
    update(s => ({ ...s, importBatches: [batch, ...s.importBatches] }));
  }, [update]);

  const deleteImportBatch = useCallback((batchId: string) => {
    update(s => ({
      ...s,
      importBatches: s.importBatches.filter(b => b.id !== batchId),
      transactions: s.transactions.filter(t => t.importBatchId !== batchId),
    }));
  }, [update]);

  // ── Settings ───────────────────────────────────────────────────────────────

  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    update(s => ({ ...s, settings: { ...s.settings, ...changes } }));
  }, [update]);

  // ── Keyword Overrides ──────────────────────────────────────────────────────

  const addKeywordOverride = useCallback((keyword: string, categoryId: string) => {
    update(s => ({
      ...s,
      keywordOverrides: { ...s.keywordOverrides, [keyword.toLowerCase()]: categoryId },
    }));
  }, [update]);

  // ── Data Management ────────────────────────────────────────────────────────

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = SEED_STATE;
    setState(fresh);
    saveState(fresh);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importData = useCallback((json: string) => {
    const parsed = JSON.parse(json) as AppState;
    setState(parsed);
    saveState(parsed);
  }, []);

  return {
    ...state,
    addTransaction, addTransactions, updateTransaction, deleteTransaction,
    bulkCategorize, bulkDelete, splitTransaction,
    addCategory, updateCategory, deleteCategory,
    addAccount, updateAccount, deleteAccount,
    addBudgetBucket, updateBudgetBucket, deleteBudgetBucket,
    updateIncomeAllocation,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addRecurringItem, updateRecurringItem, deleteRecurringItem,
    addImportBatch, deleteImportBatch,
    updateSettings,
    addKeywordOverride,
    clearAllData, exportData, importData,
  };
}

export type StoreType = ReturnType<typeof useStore>;
