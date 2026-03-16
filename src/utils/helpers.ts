import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import type { Transaction } from '../types';

export function fmtCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtCurrencySigned(amount: number, symbol = '$'): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${symbol}${Math.abs(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'd MMM yyyy'); } catch { return dateStr; }
}

export function fmtDateShort(dateStr: string): string {
  try { return format(parseISO(dateStr), 'd MMM'); } catch { return dateStr; }
}

export function fmtMonth(dateStr: string): string {
  try { return format(parseISO(dateStr + '-01'), 'MMM yyyy'); } catch { return dateStr; }
}

export function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM');
}

export function getLastNMonths(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) =>
    getMonthKey(subMonths(startOfMonth(now), n - 1 - i))
  );
}

export function calcMonthlySpend(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string
): number {
  return transactions
    .filter(t => t.categoryId === categoryId && t.date.startsWith(monthKey) && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
}

export function calcTotalSpendByCategory(
  transactions: Transaction[],
  monthKey?: string
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    if (monthKey && !t.date.startsWith(monthKey)) continue;
    totals[t.categoryId] = (totals[t.categoryId] ?? 0) + Math.abs(t.amount);
  }
  return totals;
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function detectDuplicates(
  existing: Transaction[],
  incoming: Omit<Transaction, 'id'>[]
): { duplicate: boolean; index: number }[] {
  return incoming.map(t => {
    const dup = existing.some(
      e =>
        e.date === t.date &&
        Math.abs(e.amount - t.amount) < 0.01 &&
        e.description.toLowerCase().trim() === t.description.toLowerCase().trim()
    );
    return { duplicate: dup, index: 0 };
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
