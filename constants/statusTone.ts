import type { GiftRedemptionStatus } from "@/apis/gift/models/gift";
import type { CheckStatus, ISignal, VerificationFlag } from "@/apis/incident/models/verification";
import { RISK_THRESHOLDS, type VerificationOutcome } from "@/constants/reportVerification";
import type { PillTone } from "@/components/ui/Pill";
import { PRIORITY } from "@/constants/priority";
import { STATUS } from "@/constants/status";

/**
 * Colour of every status tag, by meaning:
 * green done/approved · red rejected/cancelled/failed · orange waiting on someone ·
 * amber needs action/returned · cyan new · blue in progress/verified · neutral draft/pending.
 * Add new statuses here; never map colours at the call site.
 */
export const STATUS_TONE: Partial<Record<STATUS, PillTone>> = {
  [STATUS.ACTIVE]: "green",
  [STATUS.APPROVED]: "green",
  [STATUS.CONFIRMED]: "green",
  [STATUS.COMPLETED]: "green",
  [STATUS.INACTIVE]: "red",
  [STATUS.DELETED]: "red",
  [STATUS.REJECTED]: "red",
  [STATUS.FAILED]: "red",
  [STATUS.CANCELED]: "red",
  [STATUS.CLOSED]: "red",
  [STATUS.UPLOAD_FAILED]: "red",
  [STATUS.DRAFT]: "neutral",
  [STATUS.PENDING]: "neutral",
  [STATUS.TODO]: "neutral",
  [STATUS.TODO_BYPASS]: "neutral",
  [STATUS.REVIEWED]: "neutral",
  [STATUS.ASSIGNED]: "neutral",
  [STATUS.NEW]: "cyan",
  [STATUS.RECEIVED]: "cyan",
  [STATUS.WAITING_APPROVED]: "orange",
  [STATUS.WAITING_CONFIRMED]: "orange",
  [STATUS.INREVIEW]: "orange",
  [STATUS.VERIFIED]: "blue",
  [STATUS.IN_PROGRESS]: "blue",
  [STATUS.UPCOMING]: "blue",
  [STATUS.RETURNED]: "amber",
  [STATUS.OBSOLETE]: "lime",
};

/** Default label of each status. Raw English; translate with `t()` at render time. */
export const STATUS_LABEL: Partial<Record<STATUS, string>> = {
  [STATUS.ACTIVE]: "Active",
  [STATUS.INACTIVE]: "Inactive",
  [STATUS.DELETED]: "Deleted",
  [STATUS.DRAFT]: "Draft",
  [STATUS.NEW]: "New",
  [STATUS.WAITING_APPROVED]: "Waiting Approved",
  [STATUS.WAITING_CONFIRMED]: "Waiting Confirmed",
  [STATUS.INREVIEW]: "Waiting Confirmed",
  [STATUS.REVIEWED]: "Reviewed",
  [STATUS.ASSIGNED]: "Assigned",
  [STATUS.CANCELED]: "Canceled",
  [STATUS.PENDING]: "Pending",
  [STATUS.VERIFIED]: "Verified",
  [STATUS.APPROVED]: "Approved",
  [STATUS.RECEIVED]: "Received",
  [STATUS.CONFIRMED]: "Confirmed",
  [STATUS.COMPLETED]: "Completed",
  [STATUS.REJECTED]: "Rejected",
  [STATUS.RETURNED]: "Returned",
  [STATUS.OBSOLETE]: "Obsolete",
  [STATUS.TODO]: "To Do",
  [STATUS.TODO_BYPASS]: "To Do",
  [STATUS.IN_PROGRESS]: "In Progress",
  [STATUS.FAILED]: "Failed",
  [STATUS.UPLOAD_FAILED]: "Failed",
  [STATUS.CLOSED]: "Closed",
  [STATUS.UPCOMING]: "Upcoming",
};

export const statusTone = (status: number): PillTone =>
  STATUS_TONE[status as STATUS] ?? "neutral";

export const PRIORITY_TONE: Record<PRIORITY, PillTone> = {
  [PRIORITY.URGENT]: "red",
  [PRIORITY.MEDIUM]: "blue",
  [PRIORITY.LOW]: "amber",
};

export const PRIORITY_LABEL: Record<PRIORITY, string> = {
  [PRIORITY.URGENT]: "Urgent",
  [PRIORITY.MEDIUM]: "Medium",
  [PRIORITY.LOW]: "Low",
};

export const GIFT_REDEEM_TONE: Record<GiftRedemptionStatus, PillTone> = {
  PROCESSING: "amber",
  SHIPPED: "blue",
  DELIVERED: "green",
  CANCELLED: "red",
};

/** Report verification outcome (specs/007); "accepted" is green even though STATUS.TODO is neutral. */
export const REPORT_OUTCOME_TONE: Record<VerificationOutcome, PillTone> = {
  checking: "neutral",
  review: "orange",
  accepted: "green",
  rejected: "red",
};

export const REPORT_OUTCOME_LABEL: Record<VerificationOutcome, string> = {
  checking: "Checking",
  review: "Awaiting review",
  accepted: "Accepted",
  rejected: "Not accepted",
};

export const RISK_FLAG_TONE: Record<VerificationFlag, PillTone> = {
  ACCEPT: "green",
  REVIEW: "orange",
  REJECT: "red",
};

export const CHECK_STATUS_TONE: Record<CheckStatus, PillTone> = {
  COMPLETED: "blue",
  SKIPPED: "neutral",
  FAILED: "red",
  NOT_AVAILABLE: "neutral",
};

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
  FAILED: "Failed",
  NOT_AVAILABLE: "Not available",
};

/** Risk of one check or of the total, by the engine thresholds; null = not scored. */
export function riskTone(risk: number | null | undefined): PillTone {
  if (risk == null) return "neutral";
  if (risk < RISK_THRESHOLDS.review) return "green";
  return risk < RISK_THRESHOLDS.reject ? "amber" : "red";
}

/** A signal chip: amber when it fired, dashed when it never ran, red when it broke. */
export function signalTone(signal: Pick<ISignal, "status" | "risk">): { tone: PillTone; dashed: boolean } {
  if (signal.status === "FAILED") return { tone: "red", dashed: false };
  if (signal.status !== "COMPLETED") return { tone: "neutral", dashed: true };
  return { tone: (signal.risk ?? 0) > 0 ? "amber" : "neutral", dashed: false };
}
