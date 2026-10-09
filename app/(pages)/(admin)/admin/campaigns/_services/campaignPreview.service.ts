import { CAMPAIGN_STATUS } from "@/constants/campaignLifecycle";

/** Snapshot keys (snake_case after the response transform) → what changed, for the admin. */
export const CHANGE_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  banner: "Banner",
  difficulty: "Difficulty",
  contact_name: "Contact name",
  contact_phone: "Contact phone",
  safety_notes: "Safety notes",
  requirements: "Participation conditions",
  days: "Days",
  meeting_points: "Meeting points and waste points",
  shifts: "Shifts",
  min_volunteers_reason: "Why fewer volunteers than suggested",
};

/** Statuses whose shifts have results to show; BLOCKED / CANCELLED only once a shift has started. */
export const RESULT_STATUSES: number[] = [
  CAMPAIGN_STATUS.ACTIVE,
  CAMPAIGN_STATUS.PENDING_COMPLETION,
  CAMPAIGN_STATUS.LEGACY_IN_REVIEW,
  CAMPAIGN_STATUS.COMPLETED,
];
export const STOPPED_STATUSES: number[] = [CAMPAIGN_STATUS.BLOCKED, CAMPAIGN_STATUS.CANCELLED];
