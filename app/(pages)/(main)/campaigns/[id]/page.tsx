'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';

import { Breadcrumbs, BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import { CampaignTabs } from './_components/CampaignTabs';
import StatsCards from './_components/StatsCards';
import { CampaignDetailProvider } from './_context/CampaignDetailContext';
import { useCampaignDetail } from './_hooks/useCampaignDetail';
import { TbArrowRight } from 'react-icons/tb';
import { Button } from '@/components/client/shared/Button';

function CampaignDetailBody() {
  const { t } = useTranslation('common');
  const { campaignId, campaign, isLoading, isError } = useCampaignDetail();

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Home'), path: '/', type: 'link' },
      {
        label: t('Campaigns'),
        path: '/campaigns',
        type: 'link',
      },
      {
        label: campaign?.title?.trim() ? campaign.title : t('Campaign'),
        path: `/campaigns/${campaignId}`,
        type: 'page',
      },
    ],
    [t, campaign, campaignId],
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <div className="space-y-2 py-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-4 flex flex-col overflow-hidden rounded-xl border border-border sm:flex-row">
          <Skeleton className="h-44 shrink-0 rounded-none sm:h-auto sm:min-h-[200px] sm:w-72" />
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-4/5 max-w-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-5 w-full">
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-10 w-full max-w-md rounded-lg mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('Campaign not found')}</EmptyTitle>
              <EmptyDescription>
                {t("We couldn't find the campaign you were looking for.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5 space-y-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="brown"
            size="medium"
            // className="min-w-[200px]"
            iconRight={<TbArrowRight className="size-4" aria-hidden />}
            // onClick={handleJoinCampaign}
          >
            {t('Join')}
          </Button>
        </div>
        <StatsCards />
        <div className="w-full min-w-0">
          <CampaignTabs />
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams() as { id: string };

  return (
    <CampaignDetailProvider campaignId={id}>
      <CampaignDetailBody />
    </CampaignDetailProvider>
  );
}
