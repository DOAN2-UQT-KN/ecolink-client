import type { IBaseResponse } from "@/types/BaseResponse";

export interface IGetCampaignRewardEstimateRequest {
  difficultyLevel: number;
}

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
