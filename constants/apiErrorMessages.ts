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
  OWNER_PROPOSAL_ALREADY_OPEN: "This organization already has an open owner proposal",
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
