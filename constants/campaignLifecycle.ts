import { STATUS } from "@/constants/status";

/**
 * Campaign lifecycle on top of the shared numeric STATUS (server:
 * `@da2/constants/campaign-lifecycle`). Approval still goes straight to ACTIVE.
 */
export const CAMPAIGN_STATUS = {
  DRAFT: STATUS.DRAFT,
  PENDING_REVIEW: STATUS.PENDING,
  NEEDS_REVISION: STATUS.RETURNED,
  ACTIVE: STATUS.ACTIVE,
  LEGACY_IN_REVIEW: STATUS.INREVIEW,
  PENDING_COMPLETION: STATUS.WAITING_CONFIRMED,
  COMPLETED: STATUS.COMPLETED,
  BLOCKED: STATUS.INACTIVE,
  EXPIRED: STATUS.OBSOLETE,
  /** Stopped before approval because the organization was locked. */
  CANCELLED: STATUS.CANCELED,
} as const;

/** Every field may still change (draft, under review, needs revision). */
export const CAMPAIGN_EDITABLE_STATUSES: number[] = [
  CAMPAIGN_STATUS.DRAFT,
  CAMPAIGN_STATUS.PENDING_REVIEW,
  CAMPAIGN_STATUS.NEEDS_REVISION,
];
export const CAMPAIGN_SUBMITTABLE_STATUSES: number[] = [
  CAMPAIGN_STATUS.DRAFT,
  CAMPAIGN_STATUS.NEEDS_REVISION,
];
export const CAMPAIGN_DELETABLE_STATUSES: number[] = [
  CAMPAIGN_STATUS.DRAFT,
  CAMPAIGN_STATUS.PENDING_REVIEW,
  CAMPAIGN_STATUS.NEEDS_REVISION,
  CAMPAIGN_STATUS.BLOCKED,
  CAMPAIGN_STATUS.EXPIRED,
];

/** Labels for campaign statuses; the shared STATUS_LABEL is generic across domains. */
export const CAMPAIGN_STATUS_LABEL: Record<number, string> = {
  [CAMPAIGN_STATUS.DRAFT]: "Draft",
  [CAMPAIGN_STATUS.PENDING_REVIEW]: "Pending review",
  [CAMPAIGN_STATUS.NEEDS_REVISION]: "Needs revision",
  [CAMPAIGN_STATUS.ACTIVE]: "Active",
  [CAMPAIGN_STATUS.LEGACY_IN_REVIEW]: "Waiting Confirmed",
  [CAMPAIGN_STATUS.PENDING_COMPLETION]: "Waiting Confirmed",
  [CAMPAIGN_STATUS.COMPLETED]: "Completed",
  [CAMPAIGN_STATUS.BLOCKED]: "Blocked",
  [CAMPAIGN_STATUS.EXPIRED]: "Expired",
  [CAMPAIGN_STATUS.CANCELLED]: "Cancelled",
};

/** Same starting values as the server; the server is the one that enforces them. */
export const CAMPAIGN_MIN_LEAD_HOURS = 48;
export const CAMPAIGN_MAX_HOURS_PER_DAY = 12;
export const CAMPAIGN_TITLE_MIN_LENGTH = 10;
export const CAMPAIGN_TITLE_MAX_LENGTH = 120;
export const CAMPAIGN_DESCRIPTION_MIN_LENGTH = 100;
export const CAMPAIGN_BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const CAMPAIGN_MEETING_POINT_MAX = 5;
export const CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM = 5;
export const CAMPAIGN_HIGH_DIFFICULTY_LEVEL = 3;
export const CAMPAIGN_HIGH_DIFFICULTY_MIN_AGE = 18;
export const CAMPAIGN_REVISION_HOLD_DAYS = 7;

/** Why the create button is disabled, as a translatable sentence. */
export const CAMPAIGN_CREATE_BLOCK_REASON_LABEL: Record<string, string> = {
  NO_PERMISSION: "Your role in this organization does not allow creating campaigns",
  ORG_LOCKED: "This organization is locked or suspended",
  REVIEW_QUEUE_FULL: "This organization already has 3 campaigns waiting for review or changes",
  UNVERIFIED_OPEN_LIMIT: "Unverified organizations can run at most 2 campaigns at a time",
};

export function stripHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Submit problems by server code (`validateCampaignForSubmit`), as translatable sentences. */
export const CAMPAIGN_ISSUE_MESSAGES: Record<string, string> = {
  TITLE_LENGTH: "Title must be 10–120 characters",
  DESCRIPTION_TOO_SHORT: "Description must be at least 100 characters",
  BANNER_REQUIRED: "A cover image is required",
  START_REQUIRED: "Start time is required",
  END_REQUIRED: "End time is required",
  START_TOO_SOON: "Start time must be at least 48 hours from now",
  END_BEFORE_START: "End time must be after the start time",
  TOO_LONG: "A campaign day lasts at most 12 hours",
  MULTI_DAY_UNSUPPORTED: "The campaign must start and end on the same day",
  CONTACT_NAME_REQUIRED: "Contact name is required",
  CONTACT_PHONE_INVALID: "Enter a valid phone number",
  DIFFICULTY_NOT_ALLOWED: "Unverified organizations can only create the lowest difficulty",
  DIFFICULTY_UNKNOWN: "This difficulty level does not exist",
  MIN_AGE_INVALID: "Minimum age must be 0–100",
  MEETING_POINT_COUNT: "A campaign needs 1–5 meeting points",
  MEETING_POINT_NAME_REQUIRED: "Name each meeting point",
  RADIUS_INVALID: "Radius must be greater than 0",
  SLOTS_INVALID: "Slots must be a positive whole number",
  LEADER_INVALID: "The person in charge must be an active member of the organization",
  GATHER_TIME_INVALID: "Gathering time must be on the campaign day, before it ends",
  REPORT_DUPLICATED: "A waste point can belong to only one meeting point",
  REPORT_UNAVAILABLE: "A waste point is no longer available (not approved or taken by another campaign)",
  REPORT_OUTSIDE_RADIUS: "A waste point is outside its meeting point's radius",
  REPORTS_REQUIRED: "Add at least one waste point",
  MEETING_POINTS_TOO_FAR: "Meeting points must be within 5 km of each other",
  SLOTS_OVER_LIMIT: "Total slots exceed the volunteers allowed for this difficulty",
};
