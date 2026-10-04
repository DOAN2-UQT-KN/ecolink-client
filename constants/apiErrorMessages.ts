/**
 * Friendlier, translatable messages for API error codes. Keys are English sentences (the
 * i18n key); `{{email}}` is filled from the part of the server message after ": ", which
 * is where the owner-list errors put the offending address.
 *
 * Codes not listed here fall back to the server's own message.
 */
const API_ERROR_MESSAGES: Record<string, string> = {
  AT_LEAST_ONE_OWNER: "Add at least one owner",
  TOO_MANY_OWNERS: "An application can have at most 5 owners",
  DUPLICATE_OWNER_EMAIL: "The same email is listed twice in the owner list",
  SUBMITTER_MUST_BE_OWNER: "You must be one of the owners",
  EXACTLY_ONE_LEGAL_REP: "Choose exactly one owner as the legal representative",
  OWNER_SUSPENDED: "The account of {{email}} is suspended",
  OWNER_QUOTA_EXCEEDED: "{{email}} already owns the maximum of 3 organizations",
  TOO_MANY_PENDING_INVITES:
    "{{email}} is already listed as an owner on too many other applications",
  OWNER_INVITE_BLOCKED: "{{email}} has opted out of owner invitations",
  OWNER_DECLINED_MUST_BE_REPLACED:
    "{{email}} declined. Remove or replace this owner before resubmitting",
  CONFIRM_EXPIRED: "This confirmation link has expired",
  ALREADY_DECLINED: "You already declined this invitation",
  ALREADY_CONFIRMED: "You already confirmed this invitation",
  APPLICATION_NOT_ACTIVE: "This application is no longer waiting for confirmations",
  RESEND_TOO_SOON: "Please wait an hour between resends",
  NOT_PENDING_REVIEW: "This application is not waiting for review",
  OWNERS_NOT_ALL_CONFIRMED: "Not every owner has confirmed yet",
  ORG_MUST_HAVE_OWNER: "An organization must keep at least one owner",
  ORG_PERMISSION_DENIED: "Your role in this organization does not allow this action",
  CAMPAIGN_PERMISSION_DENIED: "You do not have permission to manage this campaign",
  SOS_PERMISSION_DENIED: "Only the campaign's managers can resolve this SOS",
  CAMPAIGN_MANAGER_NOT_MEMBER:
    "Campaign managers must be active members of the campaign's organization",
  CANNOT_REMOVE_CAMPAIGN_CREATOR: "The campaign creator cannot be removed as a manager",
  CAMPAIGN_INVALID: "The campaign is missing information or breaks a rule",
  CAMPAIGN_REPORTS_TAKEN:
    "Some waste points were just taken by another campaign; remove them and try again",
  CAMPAIGN_CREATE_NOT_ALLOWED: "This organization cannot create or submit a campaign right now",
  CAMPAIGN_INVALID_TRANSITION: "The campaign changed meanwhile; reload and try again",
  CAMPAIGN_REVIEW_CONFLICT_OF_INTEREST:
    "Admins cannot review campaigns of an organization they belong to",
  CAMPAIGN_NOT_EDITABLE: "These fields cannot be changed once the campaign is approved",
  CAMPAIGN_NOT_DELETABLE: "This campaign can no longer be deleted",
  CAMPAIGN_NOT_REGISTRABLE: "This campaign has no shift open for registration",
  SHIFT_NOT_REGISTRABLE: "Some shifts have started or were turned off; reload and choose again",
  CONDITIONS_NOT_ACCEPTED: "Confirm that you meet the participation conditions",
  SHIFT_ALREADY_STARTED: "This shift has already started",
  DAY_NEEDS_ACTIVE_SHIFT: "Each day needs at least one shift that runs",
  NEARBY_INVITE_TOO_SOON: "Nearby residents were invited recently; try again later",
  CAMPAIGN_NOT_CANCELLABLE:
    "Only an upcoming or running campaign, or an approved one under review again, can be cancelled",
  CAMPAIGN_HAS_VOLUNTEERS: "Volunteers have registered for this campaign; cancel it instead of deleting it",
  ATTENDANCE_QR_INVALID: "The QR code has expired; please scan again",
  ATTENDANCE_NOT_OPEN: "Attendance for this shift is not open",
  ATTENDANCE_SELF_CHECK_IN:
    "You cannot check yourself in to a shift you run; scan the code of a shift another manager runs",
  ATTENDANCE_MANUAL_LIMIT: "Manual attendance is limited to 20% of the people present on the shift",
  ATTENDANCE_ALREADY_RECORDED: "This person already has attendance on this shift",
  ATTENDANCE_LEGACY_GONE: "Attendance is now per shift; update the app and scan the shift's QR code",
  SHIFT_NOT_STARTED: "This shift has not started yet",
  SHIFT_RESULT_REQUIRED: "Submit the shift's result before ending it",
  SHIFT_RESULT_INVALID: "The shift's result is incomplete or invalid",
  SHIFT_RESULT_LOCKED: "The shift's result can no longer be changed",
  CAMPAIGN_SHIFTS_NOT_ENDED:
    "Every active shift must be ended, with its result, before the campaign is marked done",
  CAMPAIGN_REPORTS_UNHANDLED: "Give a reason for every trash report no shift handled",
  CAMPAIGN_COMPLETION_REJECT_LIMIT:
    "This completion was already rejected 3 times; approve or cancel the campaign",
  SHIFT_MIN_REQUIRED: "A running shift needs at least one volunteer; turn the shift off instead",
  CAMPAIGN_LEADER_NOT_MANAGER:
    "A shift leader must be one of the campaign's managers or an owner of its organization",
  CAMPAIGN_MANAGER_LEADS_SHIFTS:
    "This manager still leads upcoming shifts; assign another leader first",
  REWARD_SERVICE_UNAVAILABLE: "The reward service is not reachable right now; try again shortly",
  ROLE_NOT_ASSIGNABLE: "You cannot assign this role",
  CANNOT_ACT_ON_MEMBER: "You cannot change or remove this member",
  MEMBER_NOT_FOUND: "This person is not a member of the organization",
  ALREADY_MEMBER: "This person is already a member of the organization",
  INVITATION_ALREADY_PENDING: "This person already has a pending invitation",
  INVITATION_NOT_FOUND: "This invitation link is invalid.",
  INVITATION_EXPIRED: "This invitation has expired",
  INVITATION_NOT_ACTIVE: "This invitation is no longer active",
  INVITEE_NOT_AVAILABLE: "This account cannot be invited",
  ALREADY_OWNER: "{{email}} is already an owner of this organization",
  OWNER_CHANGE_ALREADY_OPEN: "A matching owner change is already open",
  OWNER_CHANGE_NOT_FOUND: "Owner change not found",
  OWNER_CHANGE_NOT_OPEN: "This owner change is no longer open",
  TARGET_NOT_OWNER: "This person is not an owner of the organization",
  NOT_PENDING_APPROVER: "Your approval is not being asked for on this owner change",
  CANNOT_TARGET_SELF: "Use step down or leave to change your own role",
  LEGAL_REP_REPLACEMENT_REQUIRED:
    "The legal representative must be replaced: pick someone to take the role over",
  ORGANIZATION_APPLICATION_NOT_EDITABLE: "This application can no longer be edited.",
  TRACKING_TOKEN_INVALID: "This tracking link is invalid or has expired.",
  ACCOUNT_PENDING_ACTIVATION:
    "This account has not been activated yet. Use the activation link sent to your email, or request a new one.",
};

/** Returns a translated message for a known error code, or null to use the default. */
export function apiErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  const key = error?.code ? API_ERROR_MESSAGES[error.code] : undefined;
  if (!key) return null;
  const detail = error?.message?.split(": ").slice(1).join(": ").trim();
  return t(key, { email: detail || "" });
}
