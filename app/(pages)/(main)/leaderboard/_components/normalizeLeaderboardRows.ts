import type {
  IGamificationLeaderboardRowOrg,
  IGamificationLeaderboardRowUser,
} from "@/apis/gamification";

import type { LeaderboardItem } from "./types";

export function normalizeLeaderboardRows(
  rows: (IGamificationLeaderboardRowUser | IGamificationLeaderboardRowOrg)[],
): LeaderboardItem[] {
  return rows.map((row) => {
    if ("userId" in row) {
      return {
        userId: row.userId,
        rank: row.rank,
        score: row.score,
        name: row.user?.name ?? "Unknown User",
        avatar: row.user?.avatar ?? "",
        participatedCount: 0,
      };
    }

    const orgShortId = row.organizationId.slice(0, 6);
    return {
      userId: row.organizationId,
      rank: row.rank,
      score: row.score,
      name: `Organization ${orgShortId}`,
      avatar: "",
      participatedCount: 0,
    };
  });
}
