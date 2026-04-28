'use client';

import { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { IPointTransaction } from '@/apis/points/models/point';
import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';

function formatTransactionDateTime(value?: string): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function TransactionCard({ transaction }: { transaction: IPointTransaction }) {
  const campaignTitle = transaction.resource?.title?.trim();
  const message = campaignTitle ? `${campaignTitle} đã hoàn thành` : 'Hoạt động đã hoàn thành';
  const timestamp = formatTransactionDateTime(transaction.created_at);
  const points = transaction.points ?? 0;
  const pointsPrefix = points > 0 ? '+' : points < 0 ? '-' : '';
  const pointsClassName =
    points > 0 ? 'text-emerald-600' : points < 0 ? 'text-rose-600' : 'text-foreground-secondary';

  return (
    <article className="flex items-center justify-between rounded-xl border border-[rgba(136,122,71,0.5)]  bg-white/80 p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground-primary sm:text-base">{message}</p>
        {timestamp && <p className="text-xs text-foreground-secondary sm:text-sm">{timestamp}</p>}
      </div>

      <p className={`text-base font-bold tabular-nums sm:text-lg ${pointsClassName}`}>
        {pointsPrefix}
        {formatPoints(Math.abs(points))}
      </p>
    </article>
  );
}

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
        <div className="mt-4 space-y-3">
          {transactions.map((transaction, index) => (
            <TransactionCard
              key={transaction.id ?? `${transaction.created_at ?? 'transaction'}-${index}`}
              transaction={transaction}
            />
          ))}
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
