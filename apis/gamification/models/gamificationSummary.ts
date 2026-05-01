import type { IBaseResponse } from "@/types/BaseResponse";
import type { ISeason } from "./season";

export interface IGamificationRankingPoints {
  citizenRp: number;
  volunteerRp: number;
  totalRp: number;
}

export interface IGamificationSpendablePoints {
  balance: number;
  nextExpiresAt: string | null;
}

export type IGetGamificationSummaryResponse = IBaseResponse<{
  season: ISeason | null;
  rankingPoints: IGamificationRankingPoints;
  spendablePoints: IGamificationSpendablePoints;
  legacyGreenPointsBalance: number;
}>;
