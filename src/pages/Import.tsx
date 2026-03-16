import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, CheckCircle, AlertCircle, ChevronRight, Trash2,
  FileText, ArrowRight, X, RefreshCw, ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/StoreContext';
import EmptyState from '../components/EmptyState';
import { parseCSV } from '../utils/csvParser';
import type { ParseResult } from '../utils/csvParser';
import { fmtCurrency, fmtDate, nanoid, detectDuplicates } from '../utils/helpers';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import type { Transaction } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'configure' | 'review' | 'success';

interface RowState {
  selected: boolean;
  categoryId: string;
  isDuplicate: boolean;
}

type ReviewFilter = 'all' | 'new' | 'duplicates';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'configure', label: 'Configure' },
    { id: 'review', label: 'Review' },
    { id: 'success', label: 'Done' },
  ];
  const order: Step[] = ['upload', 'configure', 'review', 'success'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    : 'bg-[#1a2744] border border-[#1e2d45] text-slate-500'
                }`}
              >
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-slate-600 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Import Page ─────────────────────────────────────────────────────────

export default function Import() {
  const {
    transactions,
    accounts,
    categories,
    importBatches,
    keywordOverrides,
    addTransactions,
    addImportBatch,
    deleteImportBatch,
  } = useAppStore();

  // Step state
  const [step, setStep] = useState<Step>('upload');

  // Upload / parse
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? '');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  // Review
  const [rowStates, setRowStates] = useState<RowState[]>([]);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [importedCount, setImportedCount] = useState(0);

  // Delete confirm
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  // ── Parse file ───────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!selectedAccountId) {
      setParseError('Please select an account before uploading.');
      return;
    }
    setParsing(true);
    setParseError(null);
    setFileName(file.name);
    try {
      const result = await parseCSV(file, selectedAccountId, keywordOverrides);
      if (result.transactions.length === 0 && result.errors.length > 0) {
        setParseError(result.errors.join('\n'));
        setParsing(false);
        return;
      }
      setParseResult(result);

      // Duplicate detection
      const dupFlags = detectDuplicates(transactions, result.transactions);
      const rows: RowState[] = result.transactions.map((t, i) => ({
        selected: !dupFlags[i].duplicate,
        categoryId: t.categoryId,
        isDuplicate: dupFlags[i].duplicate,
      }));
      setRowStates(rows);
      setParsing(false);
      setStep('configure');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Unknown error during parsing.');
      setParsing(false);
    }
  }

  // ── Dropzone ─────────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) handleFile(accepted[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedAccountId, keywordOverrides, transactions]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    multiple: false,
    noClick: false,
  });

  // ── Row state helpers ─────────────────────────────────────────────────────────

  function toggleRow(i: number) {
    setRowStates(rs => rs.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));
  }

  function setRowCategory(i: number, catId: string) {
    setRowStates(rs => rs.map((r, idx) => (idx === i ? { ...r, categoryId: catId } : r)));
  }

  const visibleIndices: number[] = (() => {
    if (!parseResult) return [];
    return parseResult.transactions.reduce<number[]>((acc, _, i) => {
      if (reviewFilter === 'all') acc.push(i);
      else if (reviewFilter === 'new' && !rowStates[i]?.isDuplicate) acc.push(i);
      else if (reviewFilter === 'duplicates' && rowStates[i]?.isDuplicate) acc.push(i);
      return acc;
    }, []);
  })();

  const visibleAllSelected =
    visibleIndices.length > 0 && visibleIndices.every(i => rowStates[i]?.selected);

  function toggleSelectVisible() {
    const allSel = visibleAllSelected;
    setRowStates(rs =>
      rs.map((r, i) =>
        visibleIndices.includes(i) ? { ...r, selected: !allSel } : r
      )
    );
  }

  // ── Import ────────────────────────────────────────────────────────────────────

  function handleImport() {
    if (!parseResult) return;

    const selectedTxs: Omit<Transaction, 'id'>[] = [];
    parseResult.transactions.forEach((t, i) => {
      if (rowStates[i]?.selected) {
        selectedTxs.push({ ...t, categoryId: rowStates[i].categoryId });
      }
    });
    if (selectedTxs.length === 0) return;

    const batchId = 'batch_' + nanoid();
    const dates = selectedTxs.map(t => t.date).sort();

    addImportBatch({
      id: batchId,
      filename: fileName,
      importedAt: new Date().toISOString(),
      transactionCount: selectedTxs.length,
      accountId: selectedAccountId,
      dateFrom: dates[0],
      dateTo: dates[dates.length - 1],
    });
    addTransactions(selectedTxs, batchId);
    setImportedCount(selectedTxs.length);
    setStep('success');
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────

  function resetFlow() {
    setStep('upload');
    setParseResult(null);
    setParseError(null);
    setFileName('');
    setRowStates([]);
    setReviewFilter('all');
    setParsing(false);
  }

  // ── Delete batch ──────────────────────────────────────────────────────────────

  function confirmDeleteBatch(batchId: string) {
    const count = transactions.filter(t => t.importBatchId === batchId).length;
    if (
      window.confirm(
        `Delete this import batch and all ${count} associated transaction(s)? This cannot be undone.`
      )
    ) {
      deleteImportBatch(batchId);
      setDeletingBatchId(null);
    }
  }

  // ── Counts for review filter ───────────────────────────────────────────────────

  const newCount = rowStates.filter(r => !r.isDuplicate).length;
  const dupCount = rowStates.filter(r => r.isDuplicate).length;
  const selectedCount = rowStates.filter(r => r.selected).length;

  const inputCls =
    'bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Import Transactions</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a bank statement CSV to import your transactions.
        </p>
      </div>

      {/* Step indicator */}
      {step !== 'success' && (
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl px-5 py-4">
          <StepIndicator current={step} />
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Account select */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
            <label className="block text-slate-300 text-sm font-medium mb-3">
              Which account are you importing into?
            </label>
            {accounts.length === 0 ? (
              <p className="text-rose-400 text-sm">
                No accounts found. Please create an account first in Settings.
              </p>
            ) : (
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className={inputCls}
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`bg-[#0d1526] border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#1e2d45] hover:border-[#2a3d5a]'
            }`}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300 text-sm">Parsing file…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-emerald-500/10 rounded-2xl p-4">
                  <Upload size={32} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-base">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Browse files
                </button>
              </div>
            )}
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 flex gap-3">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-400 font-medium text-sm">Failed to parse file</p>
                <pre className="text-rose-300/70 text-xs mt-1 whitespace-pre-wrap">{parseError}</pre>
              </div>
            </div>
          )}

          {/* Format tips */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
            <p className="text-slate-300 text-sm font-medium mb-3">Supported bank formats</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['ANZ', 'CBA', 'NAB', 'Westpac'].map(bank => (
                <div
                  key={bank}
                  className="bg-[#1a2744] border border-[#1e2d45] rounded-lg px-3 py-2 text-center"
                >
                  <p className="text-white text-sm font-semibold">{bank}</p>
                  <p className="text-slate-500 text-xs mt-0.5">CSV export</p>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-3">
              Files must have columns for date, description, and amount. Debit/credit columns are also supported.
              Date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Configure ── */}
      {step === 'configure' && parseResult && (
        <div className="space-y-5">
          {/* Parse stats */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-medium">{fileName}</p>
                <p className="text-slate-400 text-sm mt-0.5">Parsing complete</p>
              </div>
              <button
                onClick={resetFlow}
                className="text-slate-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
              >
                <X size={13} /> Start over
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{parseResult.transactions.length}</p>
                <p className="text-slate-400 text-xs mt-1">Transactions found</p>
              </div>
              <div className="bg-[#1a2744] border border-[#1e2d45] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-300">{parseResult.skipped}</p>
                <p className="text-slate-400 text-xs mt-1">Rows skipped</p>
              </div>
              <div
                className={`rounded-lg p-3 text-center border ${
                  parseResult.errors.length > 0
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-[#1a2744] border-[#1e2d45]'
                }`}
              >
                <p
                  className={`text-2xl font-bold ${
                    parseResult.errors.length > 0 ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {parseResult.errors.length}
                </p>
                <p className="text-slate-400 text-xs mt-1">Errors</p>
              </div>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p className="text-rose-400 text-xs font-medium mb-2">Parse errors:</p>
                <ul className="space-y-1">
                  {parseResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i} className="text-rose-300/70 text-xs flex gap-1.5">
                      <span className="text-rose-500">•</span> {e}
                    </li>
                  ))}
                  {parseResult.errors.length > 10 && (
                    <li className="text-slate-500 text-xs">
                      …and {parseResult.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Account confirmation */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5">
            <p className="text-slate-300 text-sm font-medium mb-3">Importing into account</p>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className={inputCls}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={resetFlow}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45]"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={parseResult.transactions.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Review transactions <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 'review' && parseResult && (
        <div className="space-y-5">
          {/* Summary + filter */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex gap-4 flex-1">
              <span className="text-emerald-400 text-sm font-medium">
                {selectedCount} selected
              </span>
              <span className="text-slate-400 text-sm">{newCount} new</span>
              {dupCount > 0 && (
                <span className="text-amber-400 text-sm">{dupCount} duplicate{dupCount !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex gap-1">
              {(['all', 'new', 'duplicates'] as ReviewFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    reviewFilter === f
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#1a2744] border border-[#1e2d45] text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Review table */}
          <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2d45]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={visibleAllSelected}
                        onChange={toggleSelectVisible}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleIndices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No transactions to show.
                      </td>
                    </tr>
                  ) : (
                    visibleIndices.map(i => {
                      const tx = parseResult.transactions[i];
                      const rs = rowStates[i];
                      if (!tx || !rs) return null;
                      const isPositive = tx.amount >= 0;
                      return (
                        <tr
                          key={i}
                          className={`border-b border-[#1e2d45]/60 transition-colors ${
                            rs.isDuplicate
                              ? 'opacity-60 bg-amber-500/5'
                              : rs.selected
                              ? 'hover:bg-[#1a2744]/40'
                              : 'opacity-50 hover:bg-[#1a2744]/20'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={rs.selected}
                              onChange={() => toggleRow(i)}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                            {fmtDate(tx.date)}
                          </td>
                          <td className="px-4 py-3 text-white text-sm max-w-[240px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={rs.categoryId}
                              onChange={e => setRowCategory(i, e.target.value)}
                              className="bg-[#070c1b] border border-[#1e2d45] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                            >
                              {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium text-sm whitespace-nowrap ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : '-'}
                            {fmtCurrency(Math.abs(tx.amount))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {rs.isDuplicate ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                New
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep('configure')}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45]"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Import {selectedCount} transaction{selectedCount !== 1 ? 's' : ''}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Success ── */}
      {step === 'success' && (
        <div className="bg-[#0d1526] border border-emerald-500/30 rounded-xl p-12 text-center space-y-5">
          <div className="flex justify-center">
            <div className="bg-emerald-500/15 rounded-full p-5">
              <CheckCircle size={48} className="text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-white text-2xl font-bold">Import successful!</h2>
            <p className="text-slate-400 mt-2">
              {importedCount} transaction{importedCount !== 1 ? 's' : ''} imported successfully.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={resetFlow}
              className="bg-[#1a2744] hover:bg-[#243355] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-[#1e2d45] flex items-center gap-2"
            >
              <Upload size={15} /> Import another file
            </button>
            <a
              href="#/transactions"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ExternalLink size={15} /> View transactions
            </a>
          </div>
        </div>
      )}

      {/* ── Import History ── */}
      <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2d45] flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Import History</h2>
          <span className="text-slate-500 text-sm">{importBatches.length} batch{importBatches.length !== 1 ? 'es' : ''}</span>
        </div>

        {importBatches.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No imports yet"
            description="Imported CSV batches will appear here so you can manage or delete them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Filename</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Imported</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Transactions</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Date range</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {importBatches.map(batch => {
                  const acc = accounts.find(a => a.id === batch.accountId);
                  const importedDate = new Date(batch.importedAt);
                  const dateStr = importedDate.toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={batch.id} className="border-b border-[#1e2d45]/60 hover:bg-[#1a2744]/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-500 shrink-0" />
                          <span className="text-white text-sm font-medium truncate max-w-[200px]" title={batch.filename}>
                            {batch.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{dateStr}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-slate-300 text-xs">
                          {acc && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: acc.color }}
                            />
                          )}
                          {acc?.name ?? batch.accountId}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full px-2 py-0.5 text-xs font-medium">
                          {batch.transactionCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {fmtDate(batch.dateFrom)} — {fmtDate(batch.dateTo)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setDeletingBatchId(null);
                              alert('To re-import, please re-upload the original CSV file.');
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-[#1a2744] rounded transition-colors"
                            title="Re-import"
                          >
                            <RefreshCw size={14} />
                          </button>
                          {deletingBatchId === batch.id ? (
                            <span className="flex items-center gap-1">
                              <span className="text-xs text-rose-400">Delete?</span>
                              <button
                                onClick={() => confirmDeleteBatch(batch.id)}
                                className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Confirm delete"
                              >
                                <CheckCircle size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingBatchId(null)}
                                className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletingBatchId(batch.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete batch"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
    </div>
  );
}
