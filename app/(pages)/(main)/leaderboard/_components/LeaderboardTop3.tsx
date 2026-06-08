'use client';

import Image from '@/components/ui/AppImage';
import { Crown } from 'lucide-react';
import type { LeaderboardItem } from './types';
import defaultAvatar from '@/public/default-avatar.png';

type LeaderboardTop3Props = {
  top3: LeaderboardItem[];
};

function podiumOrder(items: LeaderboardItem[]) {
  const first = items.find((item) => item.rank === 1);
  const second = items.find((item) => item.rank === 2);
  const third = items.find((item) => item.rank === 3);
  return [second, first, third].filter(Boolean) as LeaderboardItem[];
}

export default function LeaderboardTop3({ top3 }: LeaderboardTop3Props) {
  const ordered = podiumOrder(top3);
  if (!ordered.length) return null;

  return (
    <div className="rounded-2xl border border-[rgba(136,122,71,0.25)] bg-gradient-to-br from-[#c5d89d]/30 via-background to-[#f5f4eb] p-5 shadow-primary-100">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        {ordered.map((user) => {
          const isFirst = user.rank === 1;
          return (
            <div
              key={user.userId}
              className={[
                'relative flex flex-col items-center rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background p-4 transition-transform hover:-translate-y-1 hover:shadow-primary-200',
                isFirst
                  ? 'sm:pb-7 ring-1 ring-[rgba(136,122,71,0.45)] shadow-primary-300'
                  : 'sm:pb-4',
              ].join(' ')}
            >
              <div className={['relative', isFirst ? 'h-24 w-24' : 'h-20 w-20'].join(' ')}>
                <Image
                  src={defaultAvatar}
                  alt={user?.name || 'Default Avatar'}
                  fill
                  sizes="96px"
                  className="rounded-full border-2 border-[rgba(136,122,71,0.4)] object-cover"
                />
              </div>
              <Crown
                className={[
                  'absolute -top-3',
                  isFirst ? 'h-7 w-7 text-button-accent-hover' : 'h-5 w-5 text-foreground-tertiary',
                ].join(' ')}
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-foreground-tertiary">#{user.rank}</p>
                <p className="max-w-[130px] truncate text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="mt-1 text-sm font-medium text-button-accent">
                  {user.score.toLocaleString()} pts
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
