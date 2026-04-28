'use client';

import { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import usePointsContext from '../_hooks/usePointsContext';
import {
  formatPoints,
  formatTransactionDate,
  inferTransactionKind,
} from '../_services/points.service';

const TransactionHistory = memo(function TransactionHistory() {
  const { transactions, isLoading, pagination, setPagination } = usePointsContext();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    [pagination.pageSize, pagination.total],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPagination({ ...pagination, current: nextPage });
    },
    [pagination, setPagination],
  );

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background-primary/10 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Transaction History</h2>

      {isLoading ? (
        <div className="mt-4 text-sm text-foreground-secondary">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="mt-4 text-sm text-foreground-secondary">No transactions found.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-foreground-secondary">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Resource Type</th>
                <th className="px-3 py-2">Resource ID</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const kind = inferTransactionKind(transaction.type, transaction.points);
                const amount = transaction.points ?? 0;

                return (
                  <tr key={transaction.id} className="border-b border-border/50 text-sm">
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          kind === 'earned'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {(transaction.type ?? kind).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3">{transaction.resource_type ?? '-'}</td>
                    <td className="px-3 py-3">{transaction.resource_id ?? '-'}</td>
                    <td
                      className={`px-3 py-3 text-right font-medium tabular-nums ${
                        amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {amount >= 0 ? '+' : '-'}
                      {formatPoints(Math.abs(amount))}
                    </td>
                    <td className="px-3 py-3">{formatTransactionDate(transaction.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <p className="text-sm text-foreground-secondary">
            Page {pagination.current} of {totalPages}
          </p>

          <button
            type="button"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= totalPages}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
});

export default TransactionHistory;
