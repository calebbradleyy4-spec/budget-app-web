import { useEffect, useState, FormEvent } from 'react';
import { useBudgetsStore } from '../store/budgets.store';
import { useCategoriesStore } from '../store/categories.store';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/currency';
import { formatMonth, previousMonth, nextMonth } from '../utils/date';
import type { BudgetWithSpentDTO, CategoryDTO } from '../types/shared';

function BudgetForm({
  initial,
  categories,
  month,
  existingCategoryIds,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: BudgetWithSpentDTO;
  categories: CategoryDTO[];
  month: string;
  existingCategoryIds: number[];
  onSubmit: (data: { category_id: number; month: string; amount: number }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' && (initial ? true : !existingCategoryIds.includes(c.id))
  );
  const [categoryId, setCategoryId] = useState<number | null>(initial?.category_id ?? null);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!categoryId) { setError('Select a category'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    try { await onSubmit({ category_id: categoryId, month, amount: amt }); }
    catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-gray-400">All expense categories already have budgets this month.</p>
            ) : (
              expenseCategories.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    categoryId === c.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{c.icon}</span>{c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {initial && (
        <p className="text-sm text-gray-600">Category: <strong>{initial.category.name}</strong></p>
      )}
      <Input label="Budget Amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export function BudgetsPage() {
  const { budgets, selectedMonth, setMonth, fetchBudgets, createBudget, updateBudget, deleteBudget, isLoading } = useBudgetsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithSpentDTO | null>(null);
  const [deleteBudgetItem, setDeleteBudgetItem] = useState<BudgetWithSpentDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchBudgets(selectedMonth); }, [selectedMonth]);

  const handleAdd = async (data: { category_id: number; month: string; amount: number }) => {
    setSaving(true);
    try { await createBudget(data); setAddOpen(false); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data: { category_id: number; month: string; amount: number }) => {
    if (!editBudget) return;
    setSaving(true);
    try { await updateBudget(editBudget.id, { amount: data.amount }); setEditBudget(null); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteBudgetItem) return;
    setSaving(true);
    try { await deleteBudget(deleteBudgetItem.id); setDeleteBudgetItem(null); }
    finally { setSaving(false); }
  };

  const existingCategoryIds = budgets.map((b) => b.category_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <Button onClick={() => setAddOpen(true)}>+ Add Budget</Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-4">
        <button onClick={() => setMonth(previousMonth(selectedMonth))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">‹</button>
        <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center">{formatMonth(selectedMonth)}</span>
        <button onClick={() => setMonth(nextMonth(selectedMonth))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">›</button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-400">Loading…</div>
      ) : budgets.length === 0 ? (
        <EmptyState title="No budgets for this month" subtitle="Add a budget to start tracking your spending" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category.color }} />
                  <span className="text-sm font-semibold text-gray-900">{b.category.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditBudget(b)} className="text-xs text-indigo-600 hover:underline px-1">Edit</button>
                  <button onClick={() => setDeleteBudgetItem(b)} className="text-xs text-red-500 hover:underline px-1">Delete</button>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">{formatCurrency(b.spent)}</span>
                <span className="text-sm text-gray-400">of {formatCurrency(b.amount)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${b.percentUsed >= 100 ? 'bg-red-500' : b.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{Math.round(b.percentUsed)}% used</span>
                <span>{b.remaining >= 0 ? `${formatCurrency(b.remaining)} left` : `${formatCurrency(Math.abs(b.remaining))} over`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Budget">
        <BudgetForm categories={categories} month={selectedMonth} existingCategoryIds={existingCategoryIds} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      <Modal open={!!editBudget} onClose={() => setEditBudget(null)} title="Edit Budget">
        {editBudget && (
          <BudgetForm initial={editBudget} categories={categories} month={selectedMonth} existingCategoryIds={existingCategoryIds} onSubmit={handleEdit} onCancel={() => setEditBudget(null)} loading={saving} />
        )}
      </Modal>

      <Modal open={!!deleteBudgetItem} onClose={() => setDeleteBudgetItem(null)} title="Delete Budget">
        <p className="text-sm text-gray-600 mb-6">Delete the budget for <strong>{deleteBudgetItem?.category.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteBudgetItem(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} className="flex-1">{saving ? 'Deleting…' : 'Delete'}</Button>
        </div>
      </Modal>
    </div>
  );
}
