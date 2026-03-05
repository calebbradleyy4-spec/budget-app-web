import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { getMonthlySummary, getMonthlyTrend, getSpendingByCategory } from '../api/reports';
import { Card } from '../components/common/Card';
import { formatCurrency } from '../utils/currency';
import { formatMonth, toYYYYMM } from '../utils/date';
import type { MonthlySummaryDTO, MonthlyTrendDTO, CategorySpendDTO } from '../types/shared';

export function ReportsPage() {
  const [summaryMonth, setSummaryMonth] = useState(toYYYYMM());
  const [trendMonths, setTrendMonths] = useState(6);

  const [summary, setSummary] = useState<MonthlySummaryDTO | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendDTO[]>([]);
  const [spending, setSpending] = useState<CategorySpendDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMonthlySummary(summaryMonth).then(setSummary),
      getSpendingByCategory(summaryMonth).then(setSpending),
    ]).finally(() => setLoading(false));
  }, [summaryMonth]);

  useEffect(() => {
    getMonthlyTrend(trendMonths).then(setTrend).catch(() => {});
  }, [trendMonths]);

  const trendData = trend.map((t) => ({
    ...t,
    month: t.month.slice(0, 7),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Month:</label>
        <input
          type="month"
          value={summaryMonth}
          onChange={(e) => setSummaryMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {/* Summary */}
      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading…</div>
      ) : summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Income</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Balance</p>
            <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatCurrency(summary.balance)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Transactions</p>
            <p className="text-lg font-bold text-gray-900">{summary.transactionCount}</p>
          </Card>
        </div>
      )}

      {/* Monthly Trend */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Monthly Trend</h2>
          <select
            value={trendMonths}
            onChange={(e) => setTrendMonths(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        {trendData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Spending by category */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Spending by Category — {formatMonth(summaryMonth)}
        </h2>
        {spending.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No spending data for this month</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <ResponsiveContainer width="100%" height={260} className="max-w-xs">
              <PieChart>
                <Pie data={spending} dataKey="total" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} label={({ percentage }) => `${Math.round(percentage)}%`}>
                  {spending.map((entry, index) => (
                    <Cell key={index} fill={entry.category_color || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 w-full">
              {spending.map((s) => (
                <li key={s.category_id} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.category_color || '#6366f1' }} />
                  <span className="text-sm text-gray-700 flex-1">{s.category_name}</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(s.total)}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{Math.round(s.percentage)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
