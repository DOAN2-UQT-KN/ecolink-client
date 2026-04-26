'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArchive, HiOutlineClock, HiOutlineUserGroup } from 'react-icons/hi';

import StatsCard from '@/components/client/shared/StatsCard';
import { cn } from '@/libs/utils';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

const StatsCards = memo(function StatsCards() {
  const { t } = useTranslation('common');
  const { currentMembers, daysSinceStart, archivedTasksCount } = useCampaignDetail();

  const daysLabel = useMemo(() => {
    if (daysSinceStart === null) return t('Not available');
    return String(daysSinceStart);
  }, [daysSinceStart, t]);

  return (
    <div
      className={cn(
        'flex w-full flex-col items-stretch justify-between gap-5 lg:flex-row',
        'backdrop-blur-sm sm:gap-5 sm:p-4',
      )}
    >
      <StatsCard
        title={t('Volunteers')}
        value={currentMembers}
        description={t('Current campaign members')}
        icon={<HiOutlineUserGroup size={22} className="text-button-accent" />}
      />
      <StatsCard
        title={t('Days since start')}
        value={daysLabel}
        description={t('From campaign start date to today')}
        icon={<HiOutlineClock size={22} className="text-button-accent" />}
      />
      <StatsCard
        title={t('Archived tasks')}
        value={archivedTasksCount}
        description={t('Completed and archived work items')}
        icon={<HiOutlineArchive size={22} className="text-button-accent" />}
      />
    </div>
  );
});

export default StatsCards;
