'use client';

import { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GiftCard } from '@/components/ui/GiftCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { useGiftContext } from '../_hooks/useGiftContext';

export const GiftList = memo(function GiftList() {
  const { t } = useTranslation();
  const { gifts, isLoading, isRedeeming, totalPages, pagination, setPagination, onRedeem } =
    useGiftContext();

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPagination({ ...pagination, current: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [pagination, setPagination],
  );

  const canGoPrevious = useMemo(() => pagination.current > 1, [pagination.current]);
  const canGoNext = useMemo(
    () => pagination.current < totalPages,
    [pagination.current, totalPages],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-[#d9e5cf] bg-[#f9f6ef] p-4 shadow-[0_8px_20px_rgba(95,111,82,0.12)]"
          >
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gift className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t('No rewards found')}</EmptyTitle>
            <EmptyDescription>{t('Try changing your filter options.')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gifts.map((gift) => (
          <GiftCard key={gift.id} gift={gift} onExchange={onRedeem} exchangePending={isRedeeming} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border/50 px-2 py-6">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={!canGoPrevious}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            {t('Previous')}
          </button>

          <span className="text-sm font-medium text-foreground-secondary">
            {t('Page')} {pagination.current} {t('of')} {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={!canGoNext}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('Next')}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
});
