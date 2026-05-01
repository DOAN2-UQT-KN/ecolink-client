import type { IBaseResponse } from "@/types/BaseResponse";

export type IGamificationLeaderboardMetric = "crp" | "vrp" | "org_aggregate";

export interface IGamificationLeaderboardUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface IGamificationLeaderboardRowUser {
  rank: number;
  score: number;
  userId: string;
  user: IGamificationLeaderboardUser | null;
}

export interface IGamificationLeaderboardRowOrg {
  rank: number;
  score: number;
  organizationId: string;
}

export interface IGetGamificationLeaderboardRequest {
  metric: IGamificationLeaderboardMetric;
  page?: number;
  limit?: number;
  seasonId?: string;
}

export type IGetGamificationLeaderboardResponse = IBaseResponse<{
  metric: string;
  seasonId: string | null;
  leaderboard: (
    | IGamificationLeaderboardRowUser
    | IGamificationLeaderboardRowOrg
  )[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export interface IGetGamificationLeaderboardMeRequest {
  metric: Exclude<IGamificationLeaderboardMetric, "org_aggregate">;
  seasonId?: string;
}

export type IGetGamificationLeaderboardMeResponse = IBaseResponse<{
  leaderboardMe: {
    rank: number;
    score: number;
    seasonId: string;
  } | null;
}>;
