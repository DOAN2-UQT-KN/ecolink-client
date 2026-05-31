'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Breadcrumbs, BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';

import LeaderboardPanel from './_components/LeaderboardPanel';

export default function LeaderboardPage() {
  const { t } = useTranslation('common');

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Home'), path: '/', type: 'link' },
      { label: t('Leaderboard'), path: '/leaderboard', type: 'page' },
    ],
    [t],
  );

  return (
    <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="mx-auto max-w-7xl space-y-6 pt-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('Leaderboard')}</h1>
          <p className="mt-1 text-sm text-foreground-tertiary">
            {t('Community Leaderboard')}
          </p>
        </div>
        <LeaderboardPanel variant="global" />
      </div>
    </main>
  );
}
