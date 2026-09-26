import { IBaseResponse } from "@/types/BaseResponse";

/** Mirrors `ApplicationDocType` on the server. */
export type ApplicationDocType =
  | "ESTABLISHMENT_DECISION"
  | "BUSINESS_LICENSE"
  | "REP_ID_CARD"
  | "OTHER";

export type OrgType =
  | "GOV"
  | "SCHOOL"
  | "CLUB"
  | "NGO"
  | "SOCIAL_ENTERPRISE";

export type ApplicationStatus =
  | "DRAFT"
  /** Submitted; waiting for every owner to confirm by email. Not visible to admins yet. */
  | "AWAITING_OWNER_CONFIRMATION"
  /** Every owner confirmed; in the admin queue. */
  | "PENDING_REVIEW"
  /** An admin asked for changes, or an owner declined / let the link expire. */
  | "NEEDS_REVISION"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

/** Statuses in which the submitter may still edit the application. */
export const EDITABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "NEEDS_REVISION",
];

export type OwnerCandidateStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "EXPIRED";

export type ApplicationLane = "A" | "B";

export type OrganizationChannelType = "FACEBOOK_PAGE" | "WEBSITE" | "ZALO_OA";

export type LegalRepIdType = "CCCD" | "MSSV" | "PASSPORT" | "OTHER";

export interface IApplicationProfile {
  name?: string;
  /** Public contact address of the organization; defaults to the submitter's email. */
  contact_email?: string | null;
  logo_url?: string;
  background_url?: string | null;
  address?: string | null;
  /** Point the applicant picked on the map; copied onto the organization when approved. */
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}

export interface IApplicationChannel {
  type: OrganizationChannelType;
  url: string;
  is_primary?: boolean;
}

export interface IApplicationDocument {
  id: string;
  doc_type: ApplicationDocType;
  file_name: string | null;
  mime_type: string;
  size_bytes: number;
  purged_at: string | null;
  created_at: string;
}

export interface IApplicationEvent {
  id: string;
  event_type: string;
  actor_id: string | null;
  /** Resolved from identity-service; null for the anonymous applicant or when unavailable. */
  actor_name: string | null;
  payload: unknown;
  created_at: string;
}

/** One owner candidate, as the submitter sees it on the tracking page. */
export interface IOwnerCandidate {
  id: string;
  email: string;
  full_name: string;
  is_legal_rep: boolean;
  national_id_document_id: string | null;
  status: OwnerCandidateStatus;
  is_submitter: boolean;
  responded_at: string | null;
  expires_at: string | null;
  sent_at: string | null;
  /** Confirmation emails sent so far. Resends are unlimited, but an hour apart. */
  sent_count: number;
  /** Earliest time a resend is allowed; null when no resend is possible. */
  next_resend_at: string | null;
  decline_reason: string | null;
}

/** Evidence an admin sees for each owner. */
export interface IAdminOwnerCandidate extends IOwnerCandidate {
  confirm_ip: string | null;
  confirm_ua: string | null;
  resolved_user_id: string | null;
  account: { user_id: string; status: number; created_at: string } | null;
  active_owner_org_count: number;
  same_ip_cluster: boolean;
}

/** KYC of the owner marked as legal representative. The full ID number is never returned. */
export interface ILegalRepresentative {
  full_name: string | null;
  email: string | null;
  id_type: LegalRepIdType | null;
  /** Only the last 4 characters are stored server-side. */
  id_last4: string | null;
  phone: string | null;
  position: string | null;
}

/** What the applicant can see behind their tracking link. */
export interface IApplication {
  id: string;
  code: string;
  type: "NEW_ORG" | "ADD_OWNER";
  org_type: OrgType | null;
  status: ApplicationStatus;
  submitter_email: string;
  contact_email: string | null;
  profile: IApplicationProfile;
  channels: IApplicationChannel[];
  documents: IApplicationDocument[];
  owners: IOwnerCandidate[];
  confirmed_count: number;
  total_owners: number;
  legal_representative: ILegalRepresentative;
  review_note: string | null;
  reject_reason: string | null;
  organization_id: string | null;
  consented_at: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

/** Admin view, with the evidence collected for each owner. */
export interface IAdminApplication extends Omit<IApplication, "owners"> {
  owners: IAdminOwnerCandidate[];
  lane: ApplicationLane | null;
  documents_waived: boolean;
  documents_waived_reason: string | null;
  submitted_by_user_id: string | null;
  email_verified_at: string | null;
  reviewer_id: string | null;
  claimed_at: string | null;
  purged_at: string | null;
  events: IApplicationEvent[];
}

export type IApplicationResponse = IBaseResponse<{ application: IApplication }>;

/** A draft save; `notified` is true when the "draft updated" email went out. */
export type ISaveApplicationResponse = IBaseResponse<{
  application: IApplication;
  notified: boolean;
}>;
export type IAdminApplicationResponse = IBaseResponse<{
  application: IAdminApplication;
}>;
