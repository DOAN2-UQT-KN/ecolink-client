'use client';

import Image from 'next/image';
import type { LeaderboardItem as LeaderboardItemType } from './types';
import defaultAvatar from '@/public/default-avatar.png';

type LeaderboardItemProps = {
  item: LeaderboardItemType;
  metricLabel: string;
  isMe?: boolean;
};

export default function LeaderboardItem({ item, metricLabel, isMe = false }: LeaderboardItemProps) {
  return (
    <div
      className={[
        'grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-3 transition-all hover:border-emerald-400/40 hover:bg-zinc-800/70',
        isMe ? 'ring-1 ring-emerald-400/50' : '',
      ].join(' ')}
    >
      <div className="text-center text-sm font-semibold text-zinc-300">#{item.rank}</div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20">
          {/* <Image
            src={item?.avatar || defaultAvatar}
            alt={item.name}
            fill
            sizes="40px"
            loading="lazy"
            className="object-cover"
          /> */}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
          <p className="text-xs text-zinc-400">Participated {item.participatedCount ?? 0} times</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-emerald-300">{item.score.toLocaleString()}</p>
        <p className="text-xs text-zinc-500">{metricLabel}</p>
      </div>
    </div>
  );
}
