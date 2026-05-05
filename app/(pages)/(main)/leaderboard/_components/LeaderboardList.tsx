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
      <div className="rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background p-6 text-center text-sm text-foreground-tertiary shadow-primary-100">
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
