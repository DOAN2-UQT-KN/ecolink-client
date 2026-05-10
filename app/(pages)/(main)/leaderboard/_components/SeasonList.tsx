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
    <div className="rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background p-4 shadow-primary-100">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-foreground">Seasons</h2>
        <p className="text-xs text-foreground-tertiary">Select a season to refresh leaderboard ranking.</p>
      </div>

      <div className="space-y-3">
        {seasons.length ? (
          seasons.map((season) => (
            <SeasonCard key={season.id} season={season} selected={season.id === selectedSeasonId} onSelect={onSelectSeason} />
          ))
        ) : (
          <div className="rounded-xl border border-[rgba(136,122,71,0.25)] bg-background p-4 text-sm text-foreground-tertiary">
            No seasons found.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-[#887A47]/10 px-3 py-1.5 text-xs text-button-accent hover:bg-[#887A47]/20 disabled:opacity-40"
        >
          Prev
        </button>
        <p className="text-xs text-foreground-tertiary">
          Page {page} / {Math.max(totalPages, 1)}
        </p>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-[#887A47]/10 px-3 py-1.5 text-xs text-button-accent hover:bg-[#887A47]/20 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
