import type { IAdminBadgeDefinition } from "@/apis/gamification/badges/models";
import {
  BADGE_CATEGORY_LABEL,
  BADGE_SCOPE_LABEL,
  type BadgeCategory,
  type BadgeScope,
} from "@/constants/badge";

export const SYMBOL_IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
export const SYMBOL_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export type BadgeFormValues = {
  name: string;
  symbol: string;
  category: BadgeCategory;
  scope: BadgeScope;
  isRepeatable: boolean;
  cooldownSeconds: string;
  maxGrantsPerUser: string;
  rulesConfigJson: string;
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

export function formatRulesConfigJson(
  rulesConfig: Record<string, unknown> | null | undefined,
): string {
  if (rulesConfig == null) return "";
  try {
    return JSON.stringify(rulesConfig, null, 2);
  } catch {
    return "";
  }
}

export function parseRulesConfigJson(
  raw: string,
): { ok: true; value: Record<string, unknown> | null } | { ok: false } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  try {
    const parsed: unknown = JSON.parse(t);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

/** Empty string → 0. Must be non‑negative integer. */
export function parseCooldownSecondsField(raw: string): number | "invalid" {
  const t = raw.trim();
  if (!t) return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return "invalid";
  return n;
}

/** Empty string → null (no cap). Otherwise positive integer. */
export function parseMaxGrantsPerUserField(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return "invalid";
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
      scope: "SEASON",
      isRepeatable: false,
      cooldownSeconds: "0",
      maxGrantsPerUser: "",
      rulesConfigJson: "",
      discountBps: "",
      bonusSp: "",
      isActive: true,
      publishNow: false,
    };
  }

  const rf = rewardFieldsFromBadge(badge.reward ?? undefined);
  const scope =
    badge.scope in BADGE_SCOPE_LABEL ? (badge.scope as BadgeScope) : "SEASON";

  return {
    name: badge.name,
    symbol: badge.symbol ?? "",
    category: (badge.category in BADGE_CATEGORY_LABEL
      ? badge.category
      : "CONTRIBUTION") as BadgeCategory,
    scope,
    isRepeatable: badge.isRepeatable,
    cooldownSeconds:
      badge.cooldownSeconds != null ? String(badge.cooldownSeconds) : "0",
    maxGrantsPerUser:
      badge.maxGrantsPerUser != null ? String(badge.maxGrantsPerUser) : "",
    rulesConfigJson: formatRulesConfigJson(badge.rulesConfig ?? undefined),
    discountBps: rf.discountBps,
    bonusSp: rf.bonusSp,
    isActive: badge.isActive,
    publishNow: false,
  };
}
