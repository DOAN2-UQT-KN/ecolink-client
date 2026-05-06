'use client';

import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import type { GroupedBadge } from '../_services/badges.service';
import {
  formatBadgeDate,
  formatRewardChips,
  getCategoryColor,
  getBadgeSymbolOrFallback,
  isSeasonActive,
} from '../_services/badges.service';

// ---------------------------------------------------------------------------
// BadgeCard
// ---------------------------------------------------------------------------

interface BadgeCardProps {
  grouped: GroupedBadge;
  isNew?: boolean;
}

const BadgeCard = memo(function BadgeCard({ grouped, isNew = false }: BadgeCardProps) {
  const { t } = useTranslation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { badge, grants, total, latestGrantedAt } = grouped;

  // Season metadata — take from the latest grant
  const latestGrant = grants[0];
  const season = latestGrant?.season ?? null;
  const isExpired = season && !isSeasonActive(season);

  const symbol = getBadgeSymbolOrFallback(badge);
  const categoryColor = getCategoryColor(badge.category);
  const rewardChips = formatRewardChips(badge.reward);
  const isSeasonal = badge.scope === 'SEASON';
  const isRepeatable = badge.isRepeatable;

  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl border bg-background p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.015] ${
        isExpired ? 'opacity-60 grayscale' : ''
      } ${isNew ? 'ring-2 ring-amber-400/60' : 'border-[rgba(136,122,71,0.4)]'}`}
    >
      {/* NEW badge ribbon */}
      {isNew && (
        <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 shadow">
          {t('New')}
        </span>
      )}

      {/* Expired overlay tag */}
      {isExpired && (
        <span className="absolute top-3 right-3 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {t('Expired')}
        </span>
      )}

      {/* Icon + title row */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(136,122,71,0.3)] bg-background-primary/10 text-2xl shadow-inner">
          {symbol}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground-primary">{badge.name}</p>

          {/* Category tag */}
          <span
            className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryColor.bg} ${categoryColor.text}`}
          >
            {badge.category}
          </span>
        </div>
      </div>

      {/* Scope chip */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isSeasonal
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isSeasonal ? '🌿' : '♾️'}{' '}
          {isSeasonal ? t('Seasonal') : t('Lifetime')}
        </span>

        {/* Repeatable indicator */}
        {isRepeatable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            <RefreshCw size={10} />
            {t('Repeatable')}
          </span>
        )}
      </div>

      {/* Season label */}
      {isSeasonal && season?.label && (
        <p className="text-xs text-foreground-secondary">
          {t('Season')}: <span className="font-medium">{season.label}</span>
        </p>
      )}

      {/* Earned date */}
      <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
        <Calendar size={12} />
        <span>
          {t('Earned')}: <span className="font-medium text-foreground-primary">{formatBadgeDate(latestGrantedAt)}</span>
        </span>
      </div>

      {/* Earned X times */}
      {isRepeatable && total > 1 && (
        <p className="text-xs font-medium text-amber-600">
          🏆 {t('Earned {{count}} times', { count: total })}
        </p>
      )}

      {/* Reward chips */}
      {rewardChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rewardChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center rounded-full bg-[rgba(136,122,71,0.12)] px-2.5 py-0.5 text-[11px] font-medium text-[#7a6a35]"
            >
              🎁 {chip}
            </span>
          ))}
        </div>
      )}

      {/* History toggle for repeatable badges */}
      {isRepeatable && total > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-foreground-secondary underline-offset-2 hover:underline focus:outline-none"
          >
            {historyOpen ? (
              <>
                <ChevronUp size={13} /> {t('Hide history')}
              </>
            ) : (
              <>
                <ChevronDown size={13} /> {t('Show history')}
              </>
            )}
          </button>

          {historyOpen && (
            <ul className="mt-2 space-y-1 rounded-lg border border-[rgba(136,122,71,0.25)] bg-background-primary/5 px-3 py-2">
              {[...grants]
                .sort(
                  (a, b) =>
                    new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime(),
                )
                .map((grant, idx) => (
                  <li
                    key={grant.id ?? idx}
                    className="flex items-center gap-2 text-xs text-foreground-secondary"
                  >
                    <span className="text-foreground-tertiary">#{total - idx}</span>
                    <span className="font-medium text-foreground-primary">
                      {formatBadgeDate(grant.grantedAt)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
});

// ---------------------------------------------------------------------------
// BadgeCardSkeleton
// ---------------------------------------------------------------------------

export function BadgeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(136,122,71,0.3)] bg-background p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export default BadgeCard;
