import { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { IPointTransaction } from '@/apis/points/models/point';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';
import { formattedDate } from '@/utils/formattedDate';

function transactionMessage(transaction: IPointTransaction, t: TFunction): string {
  const campaignTitle = transaction.resource?.title?.trim();
  const redemption = transaction.resource as { gift?: { name?: string }; quantity?: number } | undefined;
  const baseName = redemption?.gift?.name?.trim();
  // One ledger row per order (spec 018): show how many items it paid for.
  const giftName =
    baseName && (redemption?.quantity ?? 1) > 1 ? `${baseName} × ${redemption?.quantity}` : baseName;
  switch (transaction.type) {
    case 'CAMPAIGN_COMPLETION':
      return campaignTitle ? t('Campaign completed message', { title: campaignTitle }) : t('Activity completed');
    case 'REPORT_VOTE_MILESTONE':
      return t('Report upvote milestone');
    case 'REPORT_COMPLETION':
      return t('Report resolved');
    case 'GIFT_REDEEM':
      return giftName ? t('Gift redeemed message', { name: giftName }) : t('Gift redeemed');
    case 'GIFT_REDEEM_REFUND':
      return giftName ? t('Gift refund message', { name: giftName }) : t('Gift refund');
    case 'EXPIRE':
      return t('Points expired');
    case 'MIGRATION_ADJUST':
      return t('Balance adjustment');
    default:
      return t('Activity completed');
  }
}

function TransactionCard({ transaction }: { transaction: IPointTransaction }) {
  const { t } = useTranslation();
  const message = transactionMessage(transaction, t);
  const timestamp = formattedDate(transaction.createdAt, true);
  const points = transaction.points ?? 0;
  const pointsPrefix = points > 0 ? '+' : points < 0 ? '-' : '';
  const pointsClassName =
    points > 0 ? 'text-emerald-600' : points < 0 ? 'text-rose-600' : 'text-foreground-secondary';

  return (
    <article className="flex items-center justify-between rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
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

function TransactionCardSkeleton() {
  return (
    <article className="flex items-center justify-between rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-14" />
    </article>
  );
}

const TransactionHistory = memo(function TransactionHistory() {
  const { t } = useTranslation();
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
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">{t('Transaction history')}</h2>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <TransactionCardSkeleton key={`transaction-skeleton-${index}`} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-4">
          <Empty className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background/20 p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History className="h-5 w-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('No transactions found.')}</EmptyTitle>
              <EmptyDescription>{t('No transactions yet for this account.')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {transactions.map((transaction, index) => (
            <TransactionCard
              key={transaction.id ?? `${transaction.createdAt ?? 'transaction'}-${index}`}
              transaction={transaction}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-[rgba(136,122,71,0.35)] pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
            className="inline-flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            {t('Previous')}
          </Button>

          <p className="text-sm text-foreground-secondary">
            {t('Page')} {pagination.current} {t('of')} {totalPages}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= totalPages}
            className="inline-flex items-center gap-2"
          >
            {t('Next')}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </section>
  );
});

export default TransactionHistory;
