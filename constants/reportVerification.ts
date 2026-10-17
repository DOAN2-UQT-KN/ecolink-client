import { STATUS } from "@/constants/status";
import type {
  CheckName,
  ModerationReasonCode,
  ReportCategory,
  VerificationStatus,
  WasteType,
} from "@/apis/incident/models/verification";

/**
 * Report verification (specs/007). Labels are untranslated English i18n keys; callers wrap them
 * in `t()`. Tones live in `constants/statusTone.ts`.
 */

/** Same order as the server enum `ReportCategory`. */
export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "WATERWAY", label: "Litter on or along a canal, river or stream" },
  { value: "BEACH", label: "Litter on a beach" },
  { value: "MARKET", label: "Litter around a market" },
  { value: "SCHOOL", label: "Litter around a school" },
  { value: "PARK", label: "Litter in a park or green space" },
  { value: "INDUSTRIAL_ZONE", label: "Waste around an industrial zone" },
  { value: "ALLEY", label: "Litter in an alley" },
  { value: "STREET", label: "Litter on a street or sidewalk" },
  { value: "ILLEGAL_DUMP", label: "Illegal dump or vacant lot" },
  { value: "DRAIN", label: "Drain clogged with litter" },
  { value: "OPEN_BURNING", label: "Open burning of waste" },
  { value: "OTHER", label: "Other" },
];

export function reportCategoryLabel(value: string | null | undefined): string | null {
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}

export const WASTE_TYPES: { value: WasteType; label: string }[] = [
  { value: "HOUSEHOLD", label: "Household waste" },
  { value: "CONSTRUCTION", label: "Construction waste" },
  { value: "INDUSTRIAL", label: "Industrial waste" },
  { value: "HAZARDOUS", label: "Hazardous waste" },
];

export interface ReasonCopy {
  title: string;
  description: string;
  fix: string | null;
  audience: "user" | "admin";
  /** One-line label for the moderation queue; falls back to `title`. */
  short?: string;
}

// A report that has a verdict cannot be re-shot (specs/011 FR-023a): fixes are advice for the next report.
const DUPLICATE_FIX =
  "Support the existing report. If this is a different incident, send a new report with a photo taken on site.";

export const REASON_COPY: Record<string, ReasonCopy> = {
  DUP_NEAR_IMAGE_MATCH: {
    title: "The photo is very similar to a photo in another report",
    description: "Another report already shows what looks like the same scene.",
    fix: DUPLICATE_FIX,
    audience: "user",
  },
  DUP_FEATURE_MATCH: {
    title: "The photo shares many details with another report",
    description: "Another report already shows what looks like the same scene.",
    fix: DUPLICATE_FIX,
    audience: "user",
  },
  DUP_WEB_IMAGE_MATCH: {
    title: "The photo already appears on the internet",
    description: "Photos found online cannot confirm the incident happened here.",
    fix: "Next time, take the photo on site with the in-app camera.",
    audience: "user",
  },
  TRUST_NOT_LIVE_CAPTURE: {
    title: "The photo was uploaded from the library",
    description: "Photos taken with the in-app camera are easier to verify.",
    fix: "Next time, take the photo with the in-app camera.",
    audience: "user",
  },
  CTX_CATEGORY_LOCATION_MISMATCH: {
    title: "The report type does not seem to match the location",
    description: "For example, “Litter around a market” with no market nearby.",
    fix: "Check the report type or the pinned location; the form suggests fitting types",
    audience: "user",
  },
  TRUST_HIGH_REJECT_RATE: {
    title: "High rejection rate",
    description: "3 or more reports in 90 days and over half were rejected.",
    fix: null,
    audience: "admin",
  },
  TRUST_NEW_ACCOUNT: {
    title: "New account",
    description: "The account is less than 7 days old.",
    fix: null,
    audience: "admin",
  },
  SYS_CHECK_FAILED_DUPLICATE: {
    title: "Duplicate check failed",
    description: "The duplicate check could not finish, so the report was sent for review.",
    fix: null,
    audience: "admin",
    short: "DuplicateCheck failed, sent for review",
  },
  MOD_DUPLICATE_OF_OTHER: {
    title: "Duplicate of another report",
    description: "A moderator found that this report repeats an existing one.",
    fix: "Support the existing report instead",
    audience: "user",
  },
  MOD_NOT_ON_SITE: {
    title: "Photo not taken on site",
    description: "A moderator found that the photo was not taken at the reported location.",
    fix: "Take the photo on site with the in-app camera",
    audience: "user",
  },
  MOD_INAPPROPRIATE_CONTENT: {
    title: "Inappropriate content",
    description: "A moderator found content that does not follow Ecolink's rules.",
    fix: null,
    audience: "user",
  },
};

const FALLBACK_COPY: ReasonCopy = {
  title: "We found an issue with this report",
  description: "A moderator will review it.",
  fix: null,
  audience: "user",
};

/** Unknown codes get a safe generic message; the caller still shows the code. */
export function reasonCopy(code: string): ReasonCopy {
  return REASON_COPY[code] ?? FALLBACK_COPY;
}

/** Mirrors the server rule: these reveal scoring internals and are never shown to the owner. */
export function isAdminOnlyReason(code: string): boolean {
  return code.startsWith("SYS_") || code === "TRUST_HIGH_REJECT_RATE" || code === "TRUST_NEW_ACCOUNT";
}

/** Short display code for a report id, e.g. `#1A2B3C4D`. */
export function shortReportCode(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export const MODERATION_REASONS: { value: ModerationReasonCode; label: string }[] = [
  { value: "DUPLICATE_OF_OTHER", label: "Duplicate of another report" },
  { value: "NOT_ON_SITE", label: "Photo not taken on site" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
];

export const CHECK_NAMES: { value: CheckName; label: string; weight: number }[] = [
  { value: "duplicate", label: "Duplicate", weight: 0.6 },
  { value: "trust", label: "Trust", weight: 0.4 },
  { value: "context", label: "Context", weight: 0.1 },
];

/** Engine flag thresholds (risk-engine v1 seed): below `review` accept, from `reject` reject. */
export const RISK_THRESHOLDS = { review: 0.3, reject: 0.7 } as const;

/**
 * The server's layer-1 score (`risk-engine.ts > assess()`): weighted mean over COMPLETED checks,
 * re-normalised by their total weight, so a missing check does not lower the score.
 * shortcut: weights come from the v1 seed because the admin view does not return them; return
 * `weights` / `thresholds` in the admin view when the engine config changes.
 */
export function riskBreakdown(
  checks: Partial<Record<CheckName, { status: string; risk: number | null }>>,
): { terms: { name: CheckName; weight: number; risk: number }[]; score: number | null } {
  const terms = CHECK_NAMES.flatMap(({ value, weight }) => {
    const c = checks[value];
    return c && c.status === "COMPLETED" && c.risk != null ? [{ name: value, weight, risk: c.risk }] : [];
  });
  const totalWeight = terms.reduce((sum, t) => sum + t.weight, 0);
  const score = totalWeight > 0 ? terms.reduce((sum, t) => sum + t.weight * t.risk, 0) / totalWeight : null;
  return { terms, score };
}

export const VERIFICATION_POLL_MS = 3000;
export const VERIFICATION_POLL_MAX_MS = 10 * 60 * 1000;

export type VerificationOutcome = "checking" | "review" | "accepted" | "rejected";

/** Outcome a report status stands for, or null for statuses outside verification (22, 24, …). */
export function reportOutcomeOf(status: number | null | undefined): VerificationOutcome | null {
  switch (status) {
    case STATUS.PENDING:
      return "checking";
    case STATUS.INREVIEW:
      return "review";
    case STATUS.TODO:
      return "accepted";
    case STATUS.INACTIVE:
      return "rejected";
    default:
      return null;
  }
}

const STEP_BY_OUTCOME: Record<VerificationOutcome, 2 | 3 | 4> = {
  checking: 2,
  review: 3,
  accepted: 4,
  rejected: 4,
};

/**
 * Progress step for the owner's panel. Null = legacy report without verification: no stepper.
 * Report status wins over the attempt, so a new RUNNING attempt on an accepted report stays accepted.
 */
export function verificationStep(
  reportStatus: number | null | undefined,
  verification: { status: VerificationStatus } | null | undefined,
): { step: 2 | 3 | 4; outcome: VerificationOutcome } | null {
  const outcome =
    reportOutcomeOf(reportStatus) ?? (verification?.status === "RUNNING" ? "checking" : null);
  return outcome ? { step: STEP_BY_OUTCOME[outcome], outcome } : null;
}

/**
 * Whether a moderator can still accept or reject the report (specs/008 FR-012): only while it
 * waits for review. A rejected report, by the engine or by an admin, is read-only here.
 */
export function canModerate(report: { status: number | null }): boolean {
  return report.status === STATUS.INREVIEW;
}
