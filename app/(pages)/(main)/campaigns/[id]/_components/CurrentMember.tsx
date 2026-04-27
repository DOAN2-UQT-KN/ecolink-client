'use client';

import Image from 'next/image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetCampaignManager } from '@/apis/campaign/getCampaignManager';
import { useGetCampaignVolunteer } from '@/apis/campaign/getCampaignVolunteer';
import { Skeleton } from '@/components/ui/skeleton';
import defaultAvatar from '@/public/default-avatar.png';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

const AvatarList = ({
  isLoading,
  items,
}: {
  isLoading: boolean;
  items: { id: string; avatar?: string | null; name?: string | null; email?: string | null }[];
}) => {
  if (isLoading) {
    return (
      <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 max-w-full" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 items-center gap-3 py-3 font-display-1">
          <Image
            src={item.avatar || defaultAvatar}
            alt={item.name || 'Default Avatar'}
            width={40}
            height={40}
            className="shrink-0 rounded-full object-cover"
          />
          <span className="min-w-0 break-words font-medium text-foreground">
            {item.name || item.email}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const CurrentMember = memo(function CurrentMember() {
  const { t } = useTranslation('common');
  const { campaignId, currentMembers } = useCampaignDetail();

  const { data: volunteerData, isLoading: isVolunteerLoading } = useGetCampaignVolunteer(
    { campaignId, limit: 100, sort_by: 'created_at', sort_order: 'asc' },
    { enabled: Boolean(campaignId) },
  );

  const { data: managerData, isLoading: isManagerLoading } = useGetCampaignManager(
    { campaignId, limit: 100, sort_by: 'created_at', sort_order: 'asc' },
    { enabled: Boolean(campaignId) },
  );

  const volunteers = (volunteerData?.data?.volunteers ?? []).map((v) => ({
    id: v.id,
    avatar: v?.volunteer?.avatar,
    name: v?.volunteer?.name,
    email: v?.volunteer?.email,
  }));

  const managers = (managerData?.data?.managers ?? []).map((m) => ({
    id: m?.user_id,
    avatar: m?.avatar,
    name: m?.name,
    email: m?.email,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Managers card */}
      <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
        <p className="font-display-1 text-muted-foreground mb-4">
          {t('Managers')}:{' '}
          <span className="font-medium text-foreground tabular-nums">{managers.length}</span>
        </p>
        <AvatarList isLoading={isManagerLoading} items={managers} />
      </div>

      {/* Members card */}
      <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
        <p className="font-display-1 text-muted-foreground mb-4">
          {t('Current members')}:{' '}
          <span className="font-medium text-foreground tabular-nums">{currentMembers}</span>
        </p>
        <AvatarList isLoading={isVolunteerLoading} items={volunteers} />
      </div>
    </div>
  );
});
