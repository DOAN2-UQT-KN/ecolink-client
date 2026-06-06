'use client';

import { memo } from 'react';

import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';

import { TbCoinFilled, TbLeaf } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

function readSpendableBalance(points: { spendablePoints?: number; spendable_points?: number; balance?: number } | null): number {
  if (!points) return 0;
  return points.spendablePoints ?? points.spendable_points ?? points.balance ?? 0;
}

function readGreenBalance(points: { greenPoints?: number; green_points?: number } | null): number {
  if (!points) return 0;
  return points.greenPoints ?? points.green_points ?? 0;
}

const MyPoints = memo(function MyPoints() {
  const { points, isLoading } = usePointsContext();

  const { t } = useTranslation();

  return (
    <section>
      <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(136,122,71,0.5)] bg-background p-4">
          <div className="font-display-2 uppercase tracking-wide text-foreground-secondary flex items-center gap-2 ">
            <TbCoinFilled className="inline-block size-8 text-yellow-500" /> {t('Spendable points (SP)')}
          </div>
          <div className="mt-2 font-display-4 font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(readSpendableBalance(points))}
          </div>
        </div>
        <div className="rounded-lg border border-[rgba(136,122,71,0.5)] bg-background p-4">
          <div className="font-display-2 uppercase tracking-wide text-foreground-secondary flex items-center gap-2">
            <TbLeaf className="inline-block size-8 text-emerald-600" /> {t('Green points')}
          </div>
          <div className="mt-2 font-display-4 font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(readGreenBalance(points))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default MyPoints;
