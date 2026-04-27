'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import SummaryCampaignCard from '@/components/client/shared/SummaryCampaignCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { useCampaignSearch } from '../_context/CampaignSearchContext';

export const CampaignList = memo(function CampaignList() {
  const { t } = useTranslation();
  const { campaigns, isLoading, total, pagination, setPagination } = useCampaignSearch();

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPagination({ ...pagination, current: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [pagination, setPagination],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pagination.pageSize)),
    [pagination.pageSize, total],
  );

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm space-y-5"
          >
            <Skeleton className="w-full h-[220px] rounded-lg" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex justify-center pt-12 pb-20">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t('No campaigns found')}</EmptyTitle>
            <EmptyDescription>
              {t('Try adjusting your search filters to find matching campaigns.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {campaigns.map((campaign) => (
          <SummaryCampaignCard key={campaign.id} campaign={campaign} exploreMode={true} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-2 py-6 border-t border-border/50">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
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
            disabled={pagination.current >= totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('Next')}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
});
