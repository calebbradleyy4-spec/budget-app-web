import { useEffect, useState, FormEvent, useMemo } from 'react';
import { useTransactionsStore } from '../store/transactions.store';
import { useCategoriesStore } from '../store/categories.store';
import type { CategoryDTO } from '../types/shared';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/currency';
import { formatDate, toYYYYMMDD } from '../utils/date';
import type { TransactionDTO, CreateTransactionInput } from '../types/shared';

const LIMIT = 20;

function TransactionForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: TransactionDTO;
  categories: CategoryDTO[];
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? toYYYYMMDD());
  const [categoryId, setCategoryId] = useState<number | null>(initial?.category_id ?? null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  // Auto-select first category when none is chosen yet
  useEffect(() => {
    if (categoryId == null && filtered.length > 0) {
      setCategoryId(filtered[0].id);
    }
  }, [filtered]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    if (categoryId == null) { setError('Please select a category'); return; }
    try {
      await onSubmit({ type, amount: amt, description, date, category_id: categoryId });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategoryId(categories.filter(c => c.type === t)[0]?.id ?? null); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              type === t ? (t === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700') : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <Input label="Amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input label="Description (optional)" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryId === c.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export function TransactionsPage() {
  const { transactions, total, totalPages, isLoading, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactionsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionDTO | null>(null);
  const [deleteTx, setDeleteTx] = useState<TransactionDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (p = 1) => {
    fetchTransactions({
      page: p,
      limit: LIMIT,
      type: typeFilter as 'income' | 'expense' | undefined || undefined,
      category_id: catFilter ? Number(catFilter) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(1); load(1); }, [typeFilter, startDate, endDate, catFilter]);

  const handleAdd = async (data: CreateTransactionInput) => {
    setSaving(true);
    try { await createTransaction(data); setAddOpen(false); load(1); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data: CreateTransactionInput) => {
    if (!editTx) return;
    setSaving(true);
    try { await updateTransaction(editTx.id, data); setEditTx(null); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    setSaving(true);
    try { await deleteTransaction(deleteTx.id); setDeleteTx(null); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button onClick={() => setAddOpen(true)}>+ Add</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        {(typeFilter || catFilter || startDate || endDate) && (
          <Button variant="outline" size="sm" onClick={() => { setTypeFilter(''); setCatFilter(''); setStartDate(''); setEndDate(''); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">Loading…</div>
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions found" subtitle="Add your first transaction to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Description', 'Category', 'Type', 'Amount', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">{tx.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditTx(tx)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTx(tx)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} total</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }}>Prev</Button>
            <span className="py-1.5 px-3">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => { setPage(page + 1); load(page + 1); }}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Transaction">
        <TransactionForm categories={categories} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Edit Transaction">
        {editTx && (
          <TransactionForm initial={editTx} categories={categories} onSubmit={handleEdit} onCancel={() => setEditTx(null)} loading={saving} />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTx} onClose={() => setDeleteTx(null)} title="Delete Transaction">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this transaction? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteTx(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} className="flex-1">
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
