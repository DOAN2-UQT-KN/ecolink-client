import type { LeaderboardItem, Season } from "./types";

export const mockLeaderboard: LeaderboardItem[] = [
  { userId: "u1", name: "Nina Tran", avatar: "https://i.pravatar.cc/200?img=1", score: 12450, rank: 1, participatedCount: 32 },
  { userId: "u2", name: "Leo Nguyen", avatar: "https://i.pravatar.cc/200?img=2", score: 11890, rank: 2, participatedCount: 28 },
  { userId: "u3", name: "Thanh Vu", avatar: "https://i.pravatar.cc/200?img=3", score: 11230, rank: 3, participatedCount: 25 },
  { userId: "u4", name: "Maya Pham", avatar: "https://i.pravatar.cc/200?img=4", score: 10210, rank: 4, participatedCount: 23 },
  { userId: "u5", name: "Quynh Le", avatar: "https://i.pravatar.cc/200?img=5", score: 9970, rank: 5, participatedCount: 22 },
  { userId: "u6", name: "Hoang Do", avatar: "https://i.pravatar.cc/200?img=6", score: 9540, rank: 6, participatedCount: 20 },
  { userId: "u7", name: "Khanh Bui", avatar: "https://i.pravatar.cc/200?img=7", score: 9105, rank: 7, participatedCount: 19 },
];

export const mockSeasons: Season[] = [
  {
    id: "s1",
    label: "Weekly Season 12",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "ACTIVE",
    progressText: "2/4",
  },
  {
    id: "s2",
    label: "Monthly Sprint 04",
    startsAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    endsAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "CLOSED",
    progressText: "4/4",
  },
  {
    id: "s3",
    label: "Community Rush 09",
    startsAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: "FROZEN",
    progressText: "3/4",
  },
];
