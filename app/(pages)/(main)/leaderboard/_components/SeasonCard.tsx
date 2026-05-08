'use client';

import Image from 'next/image';
import type { Season } from './types';
import defaultAvatar from '@/public/default-avatar.png';

type SeasonCardProps = {
  season: Season;
  selected: boolean;
  onSelect: (id: string) => void;
};

function getStatusClass(status: Season['status']) {
  if (status === 'ACTIVE') return 'bg-[#9cab84]/30 text-[#556329]';
  if (status === 'FROZEN') return 'bg-[#c5d89d]/40 text-[#665814]';
  return 'bg-muted text-foreground-secondary';
}

export default function SeasonCard({ season, selected, onSelect }: SeasonCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(season.id)}
      className={[
        'w-full rounded-2xl border p-3 text-left transition-all',
        selected
          ? 'border-[rgba(136,122,71,0.45)] bg-[#887A47]/10 shadow-primary-200'
          : 'border-[rgba(136,122,71,0.25)] bg-background hover:border-[rgba(136,122,71,0.45)] hover:bg-[#887A47]/5',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[rgba(136,122,71,0.25)] bg-[#887A47]/10">
          <Image
            src={season.thumbnail || defaultAvatar}
            alt={season.label}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{season.label}</p>
          <p className="mt-0.5 text-xs text-foreground-tertiary">
            {new Date(season.startsAt).toLocaleDateString()} -{' '}
            {new Date(season.endsAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                getStatusClass(season.status),
              ].join(' ')}
            >
              {season.status}
            </span>
            <span className="text-xs text-foreground-tertiary">{season.progressText ?? '0/4'}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
