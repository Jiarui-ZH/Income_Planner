import Papa from 'papaparse';
import type { Transaction } from '../types';
import { autoCategorize } from './categories';
import { nanoid } from './helpers';

export interface ParseResult {
  transactions: Omit<Transaction, 'id'>[];
  errors: string[];
  skipped: number;
}

function parseAmt(val: string): number {
  if (!val || val.trim() === '') return NaN;
  // Strip everything except digits, dot, and leading minus
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned);
}

function parseDate(val: string): string | null {
  const v = val.trim();
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  // Try native parse as last resort
  const n = new Date(v);
  if (!isNaN(n.getTime())) return n.toISOString().slice(0, 10);
  return null;
}

function looksLikeAmount(val: string): boolean {
  return /^[+\-]?\$?[\d,]+(\.\d+)?$/.test(val.trim());
}

const HEADER_DATE_WORDS = ['date', 'transaction date', 'value date', 'posted'];
const HEADER_DESC_WORDS = ['description', 'narrative', 'memo', 'details', 'payee', 'reference', 'particulars'];
const HEADER_AMT_WORDS  = ['amount', 'transaction amount', 'net amount'];
const HEADER_DEBIT_WORDS  = ['debit', 'withdrawal', 'withdrawals', 'charge', 'dr'];
const HEADER_CREDIT_WORDS = ['credit', 'deposit', 'deposits', 'cr'];

function findHeaderCol(headers: string[], candidates: string[]): number {
  const h = headers.map(s => s.toLowerCase().trim());
  return h.findIndex(col => candidates.some(c => col.includes(c)));
}

// ─── Headerless column detection (CommBank, Bankwest, etc.) ──────────────────
// Scans the first data row and assigns columns by value type.
// CommBank format: Date | Amount | Description | Balance
function detectHeaderlessCols(firstRow: string[]): {
  dateCol: number; descCol: number; amtCol: number;
} {
  let dateCol = -1;
  let amtCol  = -1;
  let descCol = -1;

  for (let i = 0; i < firstRow.length; i++) {
    const v = firstRow[i].trim();
    if (dateCol === -1 && parseDate(v) !== null) {
      dateCol = i;
      continue;
    }
    // Amount: looks like a number but NOT a long description
    if (amtCol === -1 && dateCol !== -1 && looksLikeAmount(v)) {
      amtCol = i;
      continue;
    }
    // Description: non-numeric text of meaningful length
    if (descCol === -1 && v.length > 2 && isNaN(parseFloat(v.replace(/[+\-$,]/g, '')))) {
      descCol = i;
    }
  }

  // CommBank puts description AFTER amount — if we missed it, grab next text col
  if (descCol === -1) {
    for (let i = 0; i < firstRow.length; i++) {
      if (i === dateCol || i === amtCol) continue;
      const v = firstRow[i].trim();
      if (v.length > 2) { descCol = i; break; }
    }
  }

  return { dateCol, descCol, amtCol };
}

export async function parseCSV(
  file: File,
  accountId: string,
  keywordOverrides: Record<string, string>
): Promise<ParseResult> {
  return new Promise(resolve => {
    // Parse without header first so we can inspect raw rows
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: rawResults => {
        const errors: string[] = [];
        const transactions: Omit<Transaction, 'id'>[] = [];
        let skipped = 0;

        const rawRows = rawResults.data;
        if (!rawRows.length) {
          resolve({ transactions: [], errors: ['No data in file'], skipped: 0 });
          return;
        }

        const firstRow = rawRows[0];
        const firstRowLower = firstRow.map(v => v.toLowerCase().trim());

        // Detect whether the first row is a header or data
        const hasHeaderRow = firstRowLower.some(v =>
          [...HEADER_DATE_WORDS, ...HEADER_DESC_WORDS, ...HEADER_AMT_WORDS,
           ...HEADER_DEBIT_WORDS, ...HEADER_CREDIT_WORDS].some(h => v.includes(h))
        );

        let dateCol: number;
        let descCol: number;
        let amtCol: number;
        let debitCol: number;
        let creditCol: number;
        let startRow: number;

        if (hasHeaderRow) {
          // Standard CSV with header row
          dateCol   = findHeaderCol(firstRow, HEADER_DATE_WORDS);
          descCol   = findHeaderCol(firstRow, HEADER_DESC_WORDS);
          amtCol    = findHeaderCol(firstRow, HEADER_AMT_WORDS);
          debitCol  = findHeaderCol(firstRow, HEADER_DEBIT_WORDS);
          creditCol = findHeaderCol(firstRow, HEADER_CREDIT_WORDS);
          startRow  = 1;
        } else {
          // Headerless CSV (CommBank, Bankwest, etc.) — detect by values
          const detected = detectHeaderlessCols(firstRow);
          dateCol   = detected.dateCol;
          descCol   = detected.descCol;
          amtCol    = detected.amtCol;
          debitCol  = -1;
          creditCol = -1;
          startRow  = 0;
        }

        if (dateCol === -1) errors.push('Could not find a date column.');
        if (descCol === -1) errors.push('Could not find a description column.');
        if (amtCol === -1 && debitCol === -1 && creditCol === -1) {
          errors.push('Could not find an amount column.');
        }
        if (dateCol === -1 || descCol === -1) {
          resolve({ transactions: [], errors, skipped: 0 });
          return;
        }

        for (let i = startRow; i < rawRows.length; i++) {
          const row = rawRows[i];
          const rawDate = (row[dateCol] ?? '').trim();
          const desc    = (row[descCol]  ?? '').trim();

          if (!desc && !rawDate) { skipped++; continue; }

          const date = parseDate(rawDate);
          if (!date) {
            errors.push(`Row ${i + 1}: invalid date "${rawDate}"`);
            skipped++;
            continue;
          }

          let amount = NaN;
          if (amtCol >= 0) {
            amount = parseAmt(row[amtCol] ?? '');
          } else {
            const credit = parseAmt(row[creditCol] ?? '');
            const debit  = parseAmt(row[debitCol]  ?? '');
            if (!isNaN(credit) && credit > 0) amount = credit;
            else if (!isNaN(debit) && debit > 0) amount = -Math.abs(debit);
            else if (!isNaN(debit)) amount = debit;
          }

          if (isNaN(amount)) { skipped++; continue; }

          // Clean up description — strip trailing card/value date suffixes CommBank adds
          const cleanDesc = desc
            .replace(/\s+Card xx\d+.*$/i, '')
            .replace(/\s+Value Date:\s*\d{2}\/\d{2}\/\d{4}$/i, '')
            .trim();

          const categoryId = autoCategorize(cleanDesc, amount, keywordOverrides);
          transactions.push({
            date,
            description: cleanDesc,
            originalDescription: desc,
            amount,
            categoryId,
            accountId,
            type: amount >= 0 ? 'income' : 'expense',
            tags: [],
            notes: '',
            isRecurring: false,
            importBatchId: 'pending_' + nanoid(),
          });
        }

        resolve({ transactions, errors, skipped });
      },
      error: err => resolve({ transactions: [], errors: [err.message], skipped: 0 }),
    });
  });
}
