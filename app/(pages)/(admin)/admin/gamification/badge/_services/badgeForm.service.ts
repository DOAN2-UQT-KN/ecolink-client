import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";
import {
  BADGE_CATEGORY_LABEL,
  BADGE_METRIC_LABEL,
  BADGE_RULE_TYPE_LABEL,
  type BadgeCategory,
  type BadgeMetric,
  type BadgeRuleType,
} from "@/constants/badge";

export const SYMBOL_IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
export const SYMBOL_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export type BadgeFormValues = {
  name: string;
  symbol: string;
  category: BadgeCategory;
  metric: BadgeMetric;
  ruleType: BadgeRuleType;
  threshold: string;
  rankTopN: string;
  discountBps: string;
  bonusSp: string;
  isActive: boolean;
  publishNow: boolean;
};

function rewardFieldsFromBadge(
  reward: Record<string, unknown> | null | undefined,
): Pick<BadgeFormValues, "discountBps" | "bonusSp"> {
  if (!reward) return { discountBps: "", bonusSp: "" };
  const rawDiscount = reward.discount_bps ?? reward.discountBps;
  const discountBps =
    typeof rawDiscount === "number" && Number.isFinite(rawDiscount) ? String(rawDiscount) : "";
  const rawBonusSp = reward.bonus_sp;
  const bonusSp =
    typeof rawBonusSp === "number" && Number.isFinite(rawBonusSp) ? String(rawBonusSp) : "";
  return { discountBps, bonusSp };
}

export function parseOptionalNonNegativeInt(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return "invalid";
  return n;
}

export function parseRankTopN(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return "invalid";
  return n;
}

export function buildRewardPayload(
  discountBpsStr: string,
  bonusSpStr: string,
): { ok: true; value: Record<string, unknown> | null } | { ok: false } {
  const discountParsed = parseOptionalNonNegativeInt(discountBpsStr);
  const bonusSpParsed = parseOptionalNonNegativeInt(bonusSpStr);
  if (discountParsed === "invalid" || bonusSpParsed === "invalid") return { ok: false };
  if (discountParsed === null && bonusSpParsed === null) return { ok: true, value: null };

  const payload: Record<string, unknown> = {};
  if (discountParsed !== null) payload.discount_bps = discountParsed;
  if (bonusSpParsed !== null) payload.bonus_sp = bonusSpParsed;
  return { ok: true, value: payload };
}

export function defaultValuesFromBadge(
  badge?: IAdminBadgeDefinition | null,
): BadgeFormValues {
  if (!badge) {
    return {
      name: "",
      symbol: "",
      category: "CONTRIBUTION",
      metric: "CRP",
      ruleType: "THRESHOLD",
      threshold: "",
      rankTopN: "",
      discountBps: "",
      bonusSp: "",
      isActive: true,
      publishNow: false,
    };
  }

  const rf = rewardFieldsFromBadge(badge.reward ?? undefined);
  return {
    name: badge.name,
    symbol: badge.symbol ?? "",
    category: (badge.category in BADGE_CATEGORY_LABEL
      ? badge.category
      : badge.ruleType === "RANK"
        ? "RANK"
        : "CONTRIBUTION") as BadgeCategory,
    metric: (badge.metric in BADGE_METRIC_LABEL ? badge.metric : "CRP") as BadgeMetric,
    ruleType: (badge.ruleType in BADGE_RULE_TYPE_LABEL
      ? badge.ruleType
      : "THRESHOLD") as BadgeRuleType,
    threshold: badge.threshold != null ? String(badge.threshold) : "",
    rankTopN: badge.rankTopN != null ? String(badge.rankTopN) : "",
    discountBps: rf.discountBps,
    bonusSp: rf.bonusSp,
    isActive: badge.isActive,
    publishNow: false,
  };
}
