'use client';

import { memo } from 'react';
import { Award, RefreshCw, Globe, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import useBadgesContext from '../_hooks/useBadgesContext';

const BadgesSummary = memo(function BadgesSummary() {
  const { t } = useTranslation();
  const { allGrouped, isLoading } = useBadgesContext();

  const totalBadges = allGrouped.length;
  const repeatableCount = allGrouped.filter((g) => g.badge.isRepeatable).length;
  const lifetimeCount = allGrouped.filter((g) => g.badge.scope === 'LIFETIME').length;
  const seasonalCount = allGrouped.filter((g) => g.badge.scope === 'SEASON').length;

  const stats = [
    {
      icon: Award,
      label: t('Total badges'),
      value: totalBadges,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      icon: Globe,
      label: t('Lifetime'),
      value: lifetimeCount,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    },
    {
      icon: Leaf,
      label: t('Seasonal'),
      value: seasonalCount,
      color: 'text-indigo-700',
      bg: 'bg-indigo-100',
    },
    {
      icon: RefreshCw,
      label: t('Repeatable'),
      value: repeatableCount,
      color: 'text-sky-700',
      bg: 'bg-sky-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="animate-pulse rounded-xl border border-[rgba(136,122,71,0.3)] bg-background p-4 shadow-sm"
          >
            <div className="mb-2 h-8 w-8 rounded-lg bg-muted" />
            <div className="h-6 w-12 rounded bg-muted" />
            <div className="mt-1 h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex flex-col gap-1 rounded-xl border border-[rgba(136,122,71,0.35)] bg-background p-4"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
              <Icon size={16} className={s.color} />
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-foreground-secondary">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
});

export default BadgesSummary;
