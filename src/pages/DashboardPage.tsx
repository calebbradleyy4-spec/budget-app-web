import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMonthlySummary } from '../api/reports';
import { getTransactions } from '../api/transactions';
import { useBudgetsStore } from '../store/budgets.store';
import { Card } from '../components/common/Card';
import { formatCurrency } from '../utils/currency';
import { formatDate, toYYYYMM } from '../utils/date';
import type { MonthlySummaryDTO, TransactionDTO } from '../types/shared';

export function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummaryDTO | null>(null);
  const [recent, setRecent] = useState<TransactionDTO[]>([]);
  const { budgets, fetchBudgets } = useBudgetsStore();
  const currentMonth = toYYYYMM();

  useEffect(() => {
    getMonthlySummary(currentMonth).then(setSummary).catch(() => {});
    getTransactions({ limit: 5 }).then((r) => setRecent(r.data)).catch(() => {});
    fetchBudgets(currentMonth);
  }, []);

  const topBudgets = budgets.slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Income</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {summary ? formatCurrency(summary.totalIncome) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {summary ? formatCurrency(summary.totalExpense) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Balance</p>
          <p className={`text-2xl font-bold mt-1 ${summary && summary.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {summary ? formatCurrency(summary.balance) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No transactions yet</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                      {tx.description || tx.category?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Budget overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Budget Overview</h2>
            <Link to="/budgets" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {topBudgets.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No budgets set</p>
          ) : (
            <ul className="space-y-4">
              {topBudgets.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{b.category.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${b.percentUsed >= 100 ? 'bg-red-500' : b.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{Math.round(b.percentUsed)}% used</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
