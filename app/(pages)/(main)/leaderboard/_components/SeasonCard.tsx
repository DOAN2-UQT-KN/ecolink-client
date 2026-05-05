'use client';

import Image from 'next/image';
import type { Season } from './types';

type SeasonCardProps = {
  season: Season;
  selected: boolean;
  onSelect: (id: string) => void;
};

function getStatusClass(status: Season['status']) {
  if (status === 'ACTIVE') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'FROZEN') return 'bg-amber-500/20 text-amber-300';
  return 'bg-zinc-500/20 text-zinc-300';
}

export default function SeasonCard({ season, selected, onSelect }: SeasonCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(season.id)}
      className={[
        'w-full rounded-2xl border p-3 text-left transition-all',
        selected
          ? 'border-emerald-400/40 bg-emerald-500/10'
          : 'border-white/10 bg-zinc-900/50 hover:border-white/30 hover:bg-zinc-800/70',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
          {/* <Image
            src={season.thumbnail || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&q=60"}
            alt={season.label}
            fill
            sizes="56px"
            className="object-cover"
          /> */}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{season.label}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
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
            <span className="text-xs text-zinc-400">{season.progressText ?? '0/4'}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
