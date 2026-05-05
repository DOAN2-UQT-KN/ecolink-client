"use client";

import SeasonCard from "./SeasonCard";
import type { Season } from "./types";

type SeasonListProps = {
  seasons: Season[];
  selectedSeasonId?: string;
  onSelectSeason: (seasonId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function SeasonList({
  seasons,
  selectedSeasonId,
  onSelectSeason,
  page,
  totalPages,
  onPageChange,
}: SeasonListProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-zinc-100">Seasons</h2>
        <p className="text-xs text-zinc-400">Select a season to refresh leaderboard ranking.</p>
      </div>

      <div className="space-y-3">
        {seasons.length ? (
          seasons.map((season) => (
            <SeasonCard key={season.id} season={season} selected={season.id === selectedSeasonId} onSelect={onSelectSeason} />
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 text-sm text-zinc-400">No seasons found.</div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
        >
          Prev
        </button>
        <p className="text-xs text-zinc-400">
          Page {page} / {Math.max(totalPages, 1)}
        </p>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
