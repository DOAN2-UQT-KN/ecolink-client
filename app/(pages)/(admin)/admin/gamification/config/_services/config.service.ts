"use client";

import requestApi from "@/utils/requestApi";
import {
  createAdminPayoutTier,
  deleteAdminPayoutTier,
  getAdminPointRules,
  getAdminSpRules,
  listAdminMultipliers,
  listAdminPayoutTiers,
  patchAdminPayoutTier,
  patchAdminPointRules,
  patchAdminSpRules,
  putAdminMultiplier,
} from "@/apis/gamification/config/list";
import type { PayoutMetric } from "@/constants/gamification";

export type ConfigTabKey =
  | "point-rules"
  | "sp-rules"
  | "multipliers"
  | "difficulty-settings"
  | "payout-tiers";

export type PointRulesData = {
  baseReportPoint: number;
  reportMilestoneThresholds: number[];
  volunteerBonusCapByDifficulty: Record<string, number>;
};

export type SpRulesData = {
  expirationDays: number;
};

export type MultiplierItem = {
  code: string;
  description: string;
  multiplier: number;
};

export type DifficultyItem = {
  id: string;
  level: number;
  name: string;
  greenPointsReward: number;
};

export type PayoutTierItem = {
  id: string;
  metric: PayoutMetric;
  rankMin: number;
  rankMax: number;
  spAmount: number;
};

export async function loadTabData(tab: ConfigTabKey) {
  if (tab === "point-rules") {
    const res = await getAdminPointRules();
    const rules = (res.data?.rules ?? {}) as Partial<PointRulesData>;
    return {
      baseReportPoint: Number(rules.baseReportPoint ?? 0),
      reportMilestoneThresholds: Array.isArray(rules.reportMilestoneThresholds)
        ? rules.reportMilestoneThresholds.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : [],
      volunteerBonusCapByDifficulty:
        (rules.volunteerBonusCapByDifficulty as Record<string, number>) ?? {},
    } satisfies PointRulesData;
  }

  if (tab === "sp-rules") {
    const res = await getAdminSpRules();
    const rules = (res.data?.rules ?? {}) as Partial<SpRulesData>;
    return {
      expirationDays: Number(rules.expirationDays ?? 0),
    } satisfies SpRulesData;
  }

  if (tab === "multipliers") {
    const res = await listAdminMultipliers();
    return (res.data?.multipliers ?? []).map((row) => ({
      code: String((row as Record<string, unknown>).code ?? ""),
      description: String((row as Record<string, unknown>).description ?? "—"),
      multiplier: Number((row as Record<string, unknown>).multiplier ?? 0),
    })) satisfies MultiplierItem[];
  }

  if (tab === "difficulty-settings") {
    const res = await requestApi.get<{
      data?: { difficulties?: Record<string, unknown>[] };
    }>("/api/v1/difficulties");
    return (res.data?.difficulties ?? []).map((row) => ({
      id: String(row.id ?? ""),
      level: Number(row.level ?? 0),
      name: String(row.name ?? ""),
      greenPointsReward: Number(row.greenPoints ?? row.green_points ?? 0),
    })) satisfies DifficultyItem[];
  }

  const res = await listAdminPayoutTiers({});
  return (res.data?.tiers ?? []).map((row) => ({
    id: String((row as Record<string, unknown>).id ?? ""),
    metric: String((row as Record<string, unknown>).metric ?? "CRP") as PayoutMetric,
    rankMin: Number((row as Record<string, unknown>).rankMin ?? 0),
    rankMax: Number((row as Record<string, unknown>).rankMax ?? 0),
    spAmount: Number((row as Record<string, unknown>).spAmount ?? 0),
  })) satisfies PayoutTierItem[];
}

export async function updatePointRules(payload: PointRulesData) {
  return patchAdminPointRules(payload);
}

export async function updateSpRules(payload: SpRulesData) {
  return patchAdminSpRules(payload);
}

export async function updateMultiplier(payload: MultiplierItem) {
  return putAdminMultiplier({
    code: payload.code,
    multiplier: payload.multiplier,
  });
}

export async function updateDifficulty(payload: DifficultyItem) {
  return requestApi.put(`/api/v1/difficulties/${payload.id}`, {
    name: payload.name,
    level: payload.level,
    greenPoints: payload.greenPointsReward,
  });
}

export async function createPayoutTier(payload: Omit<PayoutTierItem, "id">) {
  return createAdminPayoutTier({
    metric: payload.metric,
    rankMin: payload.rankMin,
    rankMax: payload.rankMax,
    spAmount: payload.spAmount,
  });
}

export async function updatePayoutTier(payload: PayoutTierItem) {
  return patchAdminPayoutTier({
    id: payload.id,
    body: {
      metric: payload.metric,
      rankMin: payload.rankMin,
      rankMax: payload.rankMax,
      spAmount: payload.spAmount,
    },
  });
}

export async function removePayoutTier(id: string) {
  return deleteAdminPayoutTier(id);
}
