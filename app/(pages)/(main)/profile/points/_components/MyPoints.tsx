'use client';

import { memo } from 'react';

import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';

import { TbCoinFilled, TbLeaf } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

const MyPoints = memo(function MyPoints() {
  const { points, isLoading } = usePointsContext();

  const { t } = useTranslation();

  return (
    <section>
      {/* <p className="text-sm text-foreground-secondary">My Points</p> */}
      <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(136,122,71,0.5)] bg-background p-4">
          <div className="font-display-2 uppercase tracking-wide text-foreground-secondary flex items-center gap-2 ">
            <TbCoinFilled className="inline-block size-8 text-yellow-500" /> {t('Coins')}
          </div>
          <div className="mt-2 font-display-4 font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(points?.balance)}
          </div>
        </div>
        <div className="rounded-lg border border-[rgba(136,122,71,0.5)] bg-background p-4">
          <div className="font-display-2 uppercase tracking-wide text-foreground-secondary flex items-center gap-2">
            <TbLeaf className="inline-block size-8 text-emerald-600" /> {t('Green points')}
          </div>
          <div className="mt-2 font-display-4 font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(points?.green_points)}
          </div>
        </div>
      </div>
    </section>
  );
});

export default MyPoints;
