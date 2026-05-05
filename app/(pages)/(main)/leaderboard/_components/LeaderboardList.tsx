"use client";

import LeaderboardItem from "./LeaderboardItem";
import type { LeaderboardItem as LeaderboardItemType } from "./types";

type LeaderboardListProps = {
  items: LeaderboardItemType[];
  metricLabel: string;
  myUserId?: string;
};

export default function LeaderboardList({ items, metricLabel, myUserId }: LeaderboardListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center text-sm text-zinc-400">
        No ranking data available for this season.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <LeaderboardItem key={`${item.userId}-${item.rank}`} item={item} metricLabel={metricLabel} isMe={item.userId === myUserId} />
      ))}
    </div>
  );
}
