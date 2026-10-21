import type { IPointRulesValues } from "@/apis/gamification/models/pointRules";

/** Form values: milestones edited as "1, 2, 5, 10". */
export interface PointRulesFormValues {
  campaignCompletionPoints: string;
  baseReportPoint: string;
  reportMilestoneThresholds: string;
  reportCompletionPoints: string;
}

export const POINT_RULE_FIELDS = [
  "campaignCompletionPoints",
  "baseReportPoint",
  "reportMilestoneThresholds",
  "reportCompletionPoints",
] as const;

export function toFormValues(rules: IPointRulesValues): PointRulesFormValues {
  return {
    campaignCompletionPoints: String(rules.campaignCompletionPoints),
    baseReportPoint: String(rules.baseReportPoint),
    reportMilestoneThresholds: rules.reportMilestoneThresholds.join(", "),
    reportCompletionPoints: String(rules.reportCompletionPoints),
  };
}

/** "1, 2, 5" → [1, 2, 5]; empty → []; anything else is left for validation to reject. */
export function parseMilestones(value: string): number[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed.split(/[\s,]+/).filter(Boolean).map(Number);
}

/** Same rules as the server: whole numbers ≥ 0. Returns an untranslated message key or true. */
export function validatePoints(value: string): true | string {
  return /^\d+$/.test(value.trim()) ? true : "Enter a whole number of 0 or more";
}

/** Milestones: whole numbers > 0, no repeats. */
export function validateMilestones(value: string): true | string {
  const list = parseMilestones(value);
  if (!list.every((n) => Number.isInteger(n) && n > 0)) {
    return "Milestones must be whole numbers greater than 0";
  }
  if (new Set(list).size !== list.length) return "Milestones must not repeat";
  return true;
}

export function toRequest(values: PointRulesFormValues): IPointRulesValues {
  return {
    campaignCompletionPoints: Number(values.campaignCompletionPoints.trim()),
    baseReportPoint: Number(values.baseReportPoint.trim()),
    reportMilestoneThresholds: parseMilestones(values.reportMilestoneThresholds),
    reportCompletionPoints: Number(values.reportCompletionPoints.trim()),
  };
}

/** One-line summary of a saved rule set, for the history table. */
export function describeChanges(
  before: IPointRulesValues | null,
  after: IPointRulesValues,
): Array<{ field: (typeof POINT_RULE_FIELDS)[number]; from: string | null; to: string }> {
  const show = (v: number | number[]) => (Array.isArray(v) ? v.join(", ") || "—" : String(v));
  return POINT_RULE_FIELDS.flatMap((field) => {
    const to = show(after[field]);
    const from = before ? show(before[field]) : null;
    return from === to ? [] : [{ field, from, to }];
  });
}
