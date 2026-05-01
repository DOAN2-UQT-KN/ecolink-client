import type { IBaseResponse } from "@/types/BaseResponse";

export interface IGamificationBadgeGrant {
  id: string;
  grantedAt: string;
  metadata?: Record<string, unknown> | null;
  season: {
    id: string;
    label: string | null;
    kind: string;
    status: string;
  };
  badge: {
    id: string;
    slug: string;
    name: string;
    ruleType: string;
    threshold: number | null;
    rankTopN: number | null;
    rankMetric: string | null;
    reward?: Record<string, unknown> | null;
  };
}

export interface IGetMyGamificationBadgesRequest {
  seasonId?: string;
}

export type IGetMyGamificationBadgesResponse = IBaseResponse<{
  badges: IGamificationBadgeGrant[];
}>;
