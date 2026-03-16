import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useAppStore } from '../store/StoreContext';
import { fmtCurrency, fmtDate, nanoid } from '../utils/helpers';
import type { SavingsGoal } from '../types';

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

// ─── Emoji picker options ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '🏖️', '✈️', '🚗', '🏠', '💻', '📱',
  '🎓', '💍', '🛡️', '🌏', '💰', '🎯',
  '🏋️', '🎸', '📷', '⛵', '🏔️', '🎉',
  '🐶', '🌱', '🎁', '🏡', '🚀', '💎',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthsDiff(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

function requiredMonthly(
  remaining: number,
  targetDate: string | undefined,
): number | null {
  if (!targetDate) return null;
  const months = monthsDiff(new Date(), new Date(targetDate));
  if (months <= 0) return null;
  return remaining / months;
}

function dateLabel(targetDate: string): string {
  const months = monthsDiff(new Date(), new Date(targetDate));
  if (months < 0) return `${Math.abs(months)} months overdue`;
  if (months === 0) return 'Due this month';
  return `${months} month${months !== 1 ? 's' : ''} away`;
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function GoalProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2.5 bg-[#1a2744] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Goal form data ────────────────────────────────────────────────────────────

interface GoalFormData {
  name: string;
  emoji: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  color: string;
  notes: string;
}

const DEFAULT_FORM: GoalFormData = {
  name: '',
  emoji: '🎯',
  targetAmount: '',
  currentAmount: '0',
  targetDate: '',
  color: '#10b981',
  notes: '',
};

// ─── Goal modal ────────────────────────────────────────────────────────────────

interface GoalModalProps {
  initial: SavingsGoal | null;
  onSave: (data: GoalFormData) => void;
  onClose: () => void;
}

function GoalModal({ initial, onSave, onClose }: GoalModalProps) {
  const [form, setForm] = useState<GoalFormData>(
    initial
      ? {
          name: initial.name,
          emoji: initial.emoji,
          targetAmount: String(initial.targetAmount),
          currentAmount: String(initial.currentAmount),
          targetDate: initial.targetDate ?? '',
          color: initial.color,
          notes: initial.notes ?? '',
        }
      : DEFAULT_FORM,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount) return;
    onSave(form);
  }

  return (
    <Modal
      title={initial ? 'Edit Goal' : 'New Savings Goal'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Goal Name</label>
          <input
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            placeholder="e.g. Europe Trip"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        {/* Emoji picker */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Emoji{' '}
            <span className="text-slate-500">(selected: {form.emoji})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setForm(f => ({ ...f, emoji: em }))}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-all ${
                  form.emoji === em
                    ? 'border-emerald-500 bg-emerald-500/20 scale-110'
                    : 'border-[#1e2d45] bg-[#1a2744] hover:border-[#2a3d5a]'
                }`}
              >
                {em}
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

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Target Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
              placeholder="10000"
              value={form.targetAmount}
              onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Current Amount ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
              placeholder="0"
              value={form.currentAmount}
              onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
            />
          </div>
        </div>

        {/* Target date */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Target Date{' '}
            <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="date"
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            value={form.targetDate}
            onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Notes{' '}
            <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            rows={3}
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full resize-none"
            placeholder="Any notes about this goal..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
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
            {initial ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Contribution modal ────────────────────────────────────────────────────────

interface ContributionModalProps {
  goal: SavingsGoal;
  onContribute: (amount: number) => void;
  onClose: () => void;
}

function ContributionModal({ goal, onContribute, onClose }: ContributionModalProps) {
  const [amount, setAmount] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (n > 0) onContribute(n);
  }

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <Modal title={`Add to ${goal.name}`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-[#1a2744] rounded-lg p-3 border border-[#1e2d45]">
          <p className="text-slate-400 text-xs mb-1">Still needed</p>
          <p className="text-white font-bold text-lg">{fmtCurrency(remaining)}</p>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Contribution Amount ($)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="bg-[#0d1526] border border-[#1e2d45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
            placeholder="e.g. 500"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Quick amount buttons */}
        <div className="flex flex-wrap gap-2">
          {[50, 100, 200, 500].map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="bg-[#1a2744] hover:bg-[#243355] text-slate-300 px-3 py-1.5 rounded-lg text-xs border border-[#1e2d45] transition-colors"
            >
              +${preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount(String(remaining.toFixed(2)))}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs border border-emerald-500/30 transition-colors"
          >
            Full amount
          </button>
        </div>

        <div className="flex gap-3 pt-1">
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
            Add Contribution
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Goal card ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
  onContribute: (goal: SavingsGoal) => void;
}

function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  const pct =
    goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyRequired = requiredMonthly(remaining, goal.targetDate);
  const isOverdue =
    goal.targetDate ? monthsDiff(new Date(), new Date(goal.targetDate)) < 0 : false;

  return (
    <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl p-5 hover:border-[#2a3d5a] transition-colors flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{goal.emoji}</span>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">
              {goal.name}
            </h3>
            {goal.targetDate && (
              <span
                className={`text-xs flex items-center gap-1 mt-0.5 ${
                  isOverdue ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                <Calendar size={11} />
                {fmtDate(goal.targetDate)} · {dateLabel(goal.targetDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <GoalProgressBar pct={pct} color={goal.color} />

      {/* Amounts */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-sm">
            {fmtCurrency(goal.currentAmount)}
          </span>
          <span className="text-slate-400 text-sm"> of {fmtCurrency(goal.targetAmount)}</span>
        </div>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: goal.color + '22', color: goal.color }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Monthly required */}
      {monthlyRequired !== null && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <TrendingUp size={12} />
          <span>
            Save{' '}
            <span className="text-white font-medium">
              {fmtCurrency(monthlyRequired)}
            </span>{' '}
            /month to reach goal by target date
          </span>
        </div>
      )}

      {/* Notes snippet */}
      {goal.notes && (
        <p className="text-slate-500 text-xs italic line-clamp-2">{goal.notes}</p>
      )}

      {/* Contribute button */}
      {!goal.completed && (
        <button
          onClick={() => onContribute(goal)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-auto"
        >
          <DollarSign size={14} />
          Add Contribution
        </button>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Goals() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } =
    useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const activeGoals = useMemo(
    () => savingsGoals.filter(g => !g.completed),
    [savingsGoals],
  );
  const completedGoals = useMemo(
    () => savingsGoals.filter(g => g.completed),
    [savingsGoals],
  );

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  function handleSave(data: GoalFormData) {
    const target = parseFloat(data.targetAmount) || 0;
    const current = parseFloat(data.currentAmount) || 0;
    const isComplete = current >= target && target > 0;

    if (editGoal) {
      updateSavingsGoal(editGoal.id, {
        name: data.name,
        emoji: data.emoji,
        targetAmount: target,
        currentAmount: current,
        targetDate: data.targetDate || undefined,
        color: data.color,
        notes: data.notes || undefined,
        completed: isComplete,
        completedDate: isComplete && !editGoal.completed
          ? new Date().toISOString().split('T')[0]
          : editGoal.completedDate,
      });
    } else {
      addSavingsGoal({
        name: data.name,
        emoji: data.emoji,
        targetAmount: target,
        currentAmount: current,
        targetDate: data.targetDate || undefined,
        color: data.color,
        notes: data.notes || undefined,
        completed: isComplete,
        completedDate: isComplete
          ? new Date().toISOString().split('T')[0]
          : undefined,
      });
    }
    setShowModal(false);
    setEditGoal(null);
  }

  function handleContribute(amount: number) {
    if (!contributingGoal) return;
    const newAmount = contributingGoal.currentAmount + amount;
    const isComplete = newAmount >= contributingGoal.targetAmount;
    updateSavingsGoal(contributingGoal.id, {
      currentAmount: newAmount,
      completed: isComplete,
      completedDate: isComplete ? new Date().toISOString().split('T')[0] : undefined,
    });
    setContributingGoal(null);
  }

  // Suppress unused import warning
  void nanoid;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Track your progress toward financial milestones
          </p>
        </div>
        <button
          onClick={() => {
            setEditGoal(null);
            setShowModal(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Goal Targets"
          value={fmtCurrency(totalTarget)}
          icon={Target}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Total Saved"
          value={fmtCurrency(totalSaved)}
          icon={DollarSign}
          iconColor="text-emerald-400"
          valueColor="text-emerald-400"
        />
        <StatCard
          title="Goals Completed"
          value={String(completedGoals.length)}
          icon={Trophy}
          iconColor="text-amber-400"
          valueColor={completedGoals.length > 0 ? 'text-amber-400' : 'text-white'}
        />
        <StatCard
          title="In Progress"
          value={String(activeGoals.length)}
          icon={TrendingUp}
          iconColor="text-purple-400"
        />
      </div>

      {/* Active goals */}
      {activeGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No active savings goals"
          description="Set up a savings goal to start tracking your progress toward something meaningful."
          action={
            <button
              onClick={() => {
                setEditGoal(null);
                setShowModal(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Create your first goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={g => {
                setEditGoal(g);
                setShowModal(true);
              }}
              onDelete={id => setDeletingId(id)}
              onContribute={g => setContributingGoal(g)}
            />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="bg-[#0d1526] border border-[#1e2d45] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setCompletedExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1a2744] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-white font-semibold">
                Completed Goals ({completedGoals.length})
              </span>
            </div>
            {completedExpanded ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </button>

          {completedExpanded && (
            <div className="px-5 pb-5 border-t border-[#1e2d45]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-4">
                {completedGoals.map(goal => {
                  const pct =
                    goal.targetAmount > 0
                      ? (goal.currentAmount / goal.targetAmount) * 100
                      : 100;
                  return (
                    <div
                      key={goal.id}
                      className="bg-[#1a2744] rounded-xl p-4 border border-[#1e2d45] flex items-center gap-3"
                    >
                      <span className="text-2xl leading-none">{goal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm truncate">
                            {goal.name}
                          </p>
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {fmtCurrency(goal.targetAmount)} · {pct.toFixed(0)}% complete
                        </p>
                        {goal.completedDate && (
                          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <Trophy size={10} />
                            Completed {fmtDate(goal.completedDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditGoal(goal);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0d1526] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New / Edit modal */}
      {showModal && (
        <GoalModal
          initial={editGoal}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditGoal(null);
          }}
        />
      )}

      {/* Contribution modal */}
      {contributingGoal !== null && (
        <ContributionModal
          goal={contributingGoal}
          onContribute={handleContribute}
          onClose={() => setContributingGoal(null)}
        />
      )}

      {/* Delete confirmation */}
      {deletingId !== null && (
        <Modal title="Delete Goal" onClose={() => setDeletingId(null)} size="sm">
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to delete this savings goal? This cannot be undone.
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
                deleteSavingsGoal(deletingId);
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
