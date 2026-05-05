import type { IBaseResponse } from "@/types/BaseResponse";
import type { ISeason } from "../season/models";

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

export interface IGetGamificationLeaderboardMeRequest {
  metric: Exclude<IGamificationLeaderboardMetric, "org_aggregate">;
  seasonId?: string;
}

export interface IGamificationRankingPoints {
  citizenRp: number;
  volunteerRp: number;
  totalRp: number;
}

export interface IGamificationSpendablePoints {
  balance: number;
  nextExpiresAt: string | null;
}

export interface IGamificationPointTransaction {
  id: string;
  kind: string;
  amount: number;
  sourceType: string;
  sourceId: string | null;
  seasonId: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface IGetGamificationPointTransactionsRequest {
  page?: number;
  limit?: number;
  kind?: "CRP" | "VRP" | "SP";
}

export interface IUserSeasonPointsRow {
  seasonId: string;
  label: string | null;
  kind: string;
  status: string;
  startsAt: string;
  endsAt: string;
  crp: number;
  vrp: number;
  sp: number;
}

export interface IGetGamificationPointsBySeasonRequest {
  page?: number;
  limit?: number;
}

export interface IGetCampaignRewardEstimateRequest {
  difficultyLevel: number;
}

export type IGetGamificationSummaryResponse = IBaseResponse<{
  season: ISeason | null;
  rankingPoints: IGamificationRankingPoints;
  spendablePoints: IGamificationSpendablePoints;
  legacyGreenPointsBalance: number;
}>;

export type IGetGamificationPointTransactionsResponse = IBaseResponse<{
  transactions: IGamificationPointTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type IGetGamificationPointsBySeasonResponse = IBaseResponse<{
  seasons: IUserSeasonPointsRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type IGetCampaignRewardEstimateResponse = IBaseResponse<{
  difficultyLevel: number;
  basePoints: number;
  estimatedBonusMax: number;
  estimatedRange: {
    min: number;
    max: number;
  };
  difficultyName: string | null;
}>;

export type IGetGamificationLeaderboardResponse = IBaseResponse<{
  metric: string;
  seasonId: string | null;
  leaderboard: (IGamificationLeaderboardRowUser | IGamificationLeaderboardRowOrg)[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type IGetGamificationLeaderboardMeResponse = IBaseResponse<{
  leaderboardMe: {
    rank: number;
    score: number;
    seasonId: string;
  } | null;
}>;
