import type { GiftRedemptionStatus } from "@/apis/gift/models/gift";
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
