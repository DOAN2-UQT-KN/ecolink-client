export type LeaderboardItem = {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  participatedCount?: number;
};

export type Season = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  progressText?: string;
  thumbnail?: string;
};

export type MetricValue = "crp" | "vrp" | "org_aggregate";
export type ScopeValue = "global" | "my_rank";
