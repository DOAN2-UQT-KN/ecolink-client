import type { IBaseResponse } from "@/types/BaseResponse";

export interface IAdminPayoutTiersQuery {
  seasonId?: string;
}

export interface IAdminPointRulesBody {
  baseReportPoint: number;
  reportMilestoneThresholds: number[];
  volunteerBonusCapByDifficulty?: Record<string, number>;
}

export interface IAdminSpRulesBody {
  expirationDays: number;
}

export interface IAdminPutMultiplierBody {
  code: string;
  multiplier: number | string;
  priority?: number;
  isActive?: boolean;
}

export interface IAdminPutSeasonScheduleBody {
  kind: string;
  autoRotate?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface IAdminCreatePayoutTierBody {
  seasonId?: string | null;
  metric: string;
  rankMin: number;
  rankMax: number;
  spAmount: number;
}

export interface IAdminPatchPayoutTierBody {
  seasonId?: string | null;
  metric?: string;
  rankMin?: number;
  rankMax?: number;
  spAmount?: number;
}

export type IAdminGetPointRulesResponse = IBaseResponse<{
  rules: Record<string, unknown> | null;
}>;

export type IAdminPatchPointRulesResponse = IBaseResponse<{
  rules: Record<string, unknown> | null;
}>;

export type IAdminGetSpRulesResponse = IBaseResponse<{
  rules: Record<string, unknown> | null;
}>;

export type IAdminPatchSpRulesResponse = IBaseResponse<{
  rules: Record<string, unknown> | null;
}>;

export type IAdminListMultipliersResponse = IBaseResponse<{
  multipliers: Record<string, unknown>[];
}>;

export type IAdminPutMultiplierResponse = IBaseResponse<{
  multiplier: Record<string, unknown>;
}>;

export type IAdminListSeasonSchedulesResponse = IBaseResponse<{
  schedules: Record<string, unknown>[];
}>;

export type IAdminPutSeasonScheduleResponse = IBaseResponse<{
  schedule: Record<string, unknown>;
}>;

export type IAdminListPayoutTiersResponse = IBaseResponse<{
  tiers: Record<string, unknown>[];
}>;

export type IAdminCreatePayoutTierResponse = IBaseResponse<{
  tier: Record<string, unknown>;
}>;

export type IAdminPatchPayoutTierResponse = IBaseResponse<{
  tier: Record<string, unknown>;
}>;

export type IAdminDeletePayoutTierResponse = IBaseResponse<{
  deleted: boolean;
}>;
