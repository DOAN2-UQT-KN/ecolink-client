'use client';

import Image from 'next/image';
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-emerald-500/10 p-5 backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        {ordered.map((user) => {
          const isFirst = user.rank === 1;
          return (
            <div
              key={user.userId}
              className={[
                'relative flex flex-col items-center rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-transform hover:-translate-y-1',
                isFirst ? 'sm:pb-7 shadow-[0_0_40px_rgba(250,204,21,0.20)]' : 'sm:pb-4',
              ].join(' ')}
            >
              <div className={['relative', isFirst ? 'h-24 w-24' : 'h-20 w-20'].join(' ')}>
                <Image
                  src={defaultAvatar}
                  alt={user?.name || 'Default Avatar'}
                  fill
                  sizes="96px"
                  className="rounded-full border-2 border-white/20 object-cover"
                />
              </div>
              <Crown
                className={[
                  'absolute -top-3',
                  isFirst ? 'h-7 w-7 text-yellow-300' : 'h-5 w-5 text-zinc-300',
                ].join(' ')}
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-zinc-400">#{user.rank}</p>
                <p className="max-w-[130px] truncate text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-300">
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
