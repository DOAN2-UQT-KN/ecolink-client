'use client';

import React, { memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetCampaigns } from '@/apis/campaign/getCampaigns';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

import { useOrganizationDetail } from '../_hooks/useOrganizationDetail';
import SummaryCampaignCard from '@/components/client/shared/SummaryCampaignCard';

export const CampaignList = memo(function CampaignList({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const { organizationId, organization } = useOrganizationDetail();
  const [page, setPage] = useState(1);

  const request = useMemo(
    () => ({
      organization_id: organizationId,
      page,
      limit: 10,
    }),
    [organizationId, page],
  );

  const { data, isLoading, isError } = useGetCampaigns(request, {
    enabled: enabled && Boolean(organizationId),
  });

  const campaigns = data?.data?.campaigns ?? [];
  const pagination = {
    current: data?.data?.page ?? page,
    pageSize: data?.data?.limit ?? 10,
    total: data?.data?.total ?? 0,
  };
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading) {
      return;
    }
    setPage(newPage);
  };

  if (!organization) {
    return null;
  }

  return (
    <div className="w-full min-h-[220px] rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm">
      {/* <div className="text-sm font-medium text-foreground">{t("Campaign")}</div> */}
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="mt-2 text-sm text-destructive">{t('Could not load campaigns.')}</p>
      ) : campaigns.length === 0 ? (
        <div className="mt-2 flex justify-center py-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('No campaigns found.')}</EmptyTitle>
              <EmptyDescription>{t('There are no campaigns for this group yet.')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <ul className="mt-4">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="py-3 first:pt-0 last:pb-0 text-sm font-medium text-foreground"
              >
                <SummaryCampaignCard campaign={c} />
              </li>
            ))}
          </ul>

          {pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between gap-4 px-6 py-3">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current <= 1 || isLoading}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#887A47]/50 px-4 py-2 text-sm font-medium text-button-accent transition-all duration-200 hover:bg-[#887A47]/5 disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('Back')}
              </button>

              <div className="hidden items-center overflow-hidden rounded-[8px] border border-[#887A47]/30 bg-white sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((currentPage) => {
                    const current = pagination.current;
                    return (
                      currentPage === 1 ||
                      currentPage === totalPages ||
                      (currentPage >= current - 1 && currentPage <= current + 1)
                    );
                  })
                  .map((currentPage, index, array) => {
                    const isLast = index === array.length - 1;
                    const hasGap = index > 0 && array[index - 1] !== currentPage - 1;

                    return (
                      <React.Fragment key={currentPage}>
                        {hasGap && (
                          <div className="border-r border-[#887A47]/30 bg-[#FBFBF8] px-2 py-2 text-[#887A47]/60">
                            ...
                          </div>
                        )}
                        <button
                          onClick={() => handlePageChange(currentPage)}
                          className={cn(
                            'cursor-pointer px-3 py-2 text-sm font-medium transition-all duration-200',
                            !isLast && 'border-r border-[#887A47]/50',
                            pagination.current === currentPage
                              ? 'bg-[#887A47] text-white'
                              : 'bg-white text-[#887A47] hover:bg-[#887A47]/5',
                          )}
                        >
                          {currentPage}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >= totalPages || isLoading}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#887A47]/30 px-4 py-2 text-sm font-medium text-button-accent transition-all duration-200 hover:bg-[#887A47]/5 disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {t('Next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
