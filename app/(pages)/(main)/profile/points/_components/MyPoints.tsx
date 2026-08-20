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
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">{t('My points')}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <TbCoinFilled className="inline-block size-8 text-yellow-500" />
            {t('Spendable points (SP)')}
          </div>
          <div className="mt-2 font-display-4 font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(readSpendableBalance(points))}
          </div>
        </div>
        <div className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <TbLeaf className="inline-block size-8 text-emerald-600" />
            {t('Green points')}
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
