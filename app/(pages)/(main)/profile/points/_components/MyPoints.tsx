'use client';

import { memo } from 'react';

import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';

const MyPoints = memo(function MyPoints() {
  const { points, isLoading } = usePointsContext();

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background-primary/10 p-5 sm:p-6">
      <p className="text-sm text-foreground-secondary">My Points</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-foreground-secondary">Balance</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {isLoading ? '...' : formatPoints(points?.balance)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Green Points</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600">
            {isLoading ? '...' : formatPoints(points?.green_points)}
          </p>
        </div>
      </div>
    </section>
  );
});

export default MyPoints;
