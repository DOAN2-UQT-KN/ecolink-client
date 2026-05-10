'use client';

import { memo, useMemo } from 'react';
import { Award } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import useBadgesContext from '../_hooks/useBadgesContext';
import BadgeCard, { BadgeCardSkeleton } from './BadgeCard';

const SKELETONS = Array.from({ length: 6 });

const BadgeGrid = memo(function BadgeGrid() {
  const { t } = useTranslation();
  const { filtered, allGrouped, isLoading } = useBadgesContext();

  // Determine the newest badge id so we can highlight it
  const newestBadgeId = useMemo(() => {
    if (allGrouped.length === 0) return null;
    const sorted = [...allGrouped].sort(
      (a, b) => new Date(b.latestGrantedAt).getTime() - new Date(a.latestGrantedAt).getTime(),
    );
    return sorted[0]?.badge.id ?? null;
  }, [allGrouped]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SKELETONS.map((_, i) => (
          <BadgeCardSkeleton key={`badge-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Empty className="rounded-[15px] border border-[rgba(136,122,71,0.3)] bg-background/40 p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Award className="h-5 w-5 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>
            {allGrouped.length === 0
              ? t("You haven't earned any badges yet.")
              : t('No badges match your filters.')}
          </EmptyTitle>
          <EmptyDescription>
            {allGrouped.length === 0 ? (
              <>
                {t('Complete campaigns and activities to earn badges.')}{' '}
                <Link
                  href="/campaigns"
                  className="font-medium text-foreground-primary underline underline-offset-4 hover:opacity-80"
                >
                  {t('Start exploring')}
                </Link>
              </>
            ) : (
              t('Try adjusting your search or filters.')
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((grouped) => (
        <BadgeCard
          key={grouped.badge.id}
          grouped={grouped}
          isNew={grouped.badge.id === newestBadgeId}
        />
      ))}
    </div>
  );
});

export default BadgeGrid;
