'use client';

import Image from '@/components/ui/AppImage';
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
        'grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl border border-[rgba(136,122,71,0.25)] bg-background px-3 py-3 transition-all hover:border-[rgba(136,122,71,0.5)] hover:bg-[#887A47]/5',
        isMe ? 'ring-1 ring-[rgba(136,122,71,0.5)] shadow-primary-100' : '',
      ].join(' ')}
    >
      <div className="text-center text-sm font-semibold text-foreground-secondary">
        #{item.rank}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[rgba(136,122,71,0.35)] bg-[#887A47]/10">
          <Image
            src={defaultAvatar}
            alt={item.name}
            fill
            sizes="40px"
            loading="lazy"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-foreground-tertiary">
            Participated {item.participatedCount ?? 0} times
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-button-accent">{item.score.toLocaleString()}</p>
        <p className="text-xs text-foreground-tertiary">{metricLabel}</p>
      </div>
    </div>
  );
}
