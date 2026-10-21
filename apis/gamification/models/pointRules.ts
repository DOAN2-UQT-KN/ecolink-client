import type { IBaseResponse } from "@/types/BaseResponse";

/** The four earning rates admins edit (reward-service point rules). */
export interface IPointRulesValues {
  campaignCompletionPoints: number;
  baseReportPoint: number;
  reportMilestoneThresholds: number[];
  reportCompletionPoints: number;
}

export interface IPointRules extends IPointRulesValues {
  id: string;
  effectiveFrom: string;
  updatedAt: string;
}

export type IGetPointRulesResponse = IBaseResponse<{ rules: IPointRules }>;

export type IUpdatePointRulesRequest = IPointRulesValues;
export type IUpdatePointRulesResponse = IBaseResponse<{ rules: IPointRules }>;

export interface IPointRuleHistoryItem {
  id: string;
  changedBy: string;
  changedByName: string | null;
  changedAt: string;
  before: IPointRulesValues | null;
  after: IPointRulesValues;
}

export interface IGetPointRuleHistoryRequest {
  page: number;
  limit: number;
}

export type IGetPointRuleHistoryResponse = IBaseResponse<{
  items: IPointRuleHistoryItem[];
  meta: { page: number; limit: number; total: number };
}>;
