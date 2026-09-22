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
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_MORE_INFO"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type ApplicationLane = "A" | "B";

export type OrganizationChannelType = "FACEBOOK_PAGE" | "WEBSITE" | "ZALO_OA";

export type LegalRepIdType = "CCCD" | "MSSV" | "PASSPORT" | "OTHER";

export interface IApplicationProfile {
  name: string;
  contact_email: string;
  logo_url: string;
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
  payload: unknown;
  created_at: string;
}

/** What the applicant can see behind their tracking link. */
export interface IApplication {
  id: string;
  code: string;
  org_type: OrgType;
  status: ApplicationStatus;
  profile: IApplicationProfile;
  channels: IApplicationChannel[];
  documents: IApplicationDocument[];
  review_note: string | null;
  reject_reason: string | null;
  organization_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

/**
 * Admin view. `legal_representative` is review-only data and is deliberately absent from
 * every public endpoint — never render it outside the admin console.
 */
export interface IAdminApplication extends IApplication {
  lane: ApplicationLane | null;
  documents_waived: boolean;
  documents_waived_reason: string | null;
  contact_email: string;
  legal_representative: {
    full_name: string | null;
    id_type: LegalRepIdType | null;
    /** Only the last 4 characters are stored server-side. */
    id_last4: string | null;
    phone: string | null;
    position: string | null;
    email: string | null;
  };
  submitted_by_user_id: string | null;
  email_verified_at: string | null;
  consented_at: string | null;
  reviewer_id: string | null;
  claimed_at: string | null;
  account_provisioned_at: string | null;
  purged_at: string | null;
  events: IApplicationEvent[];
}

export type IApplicationResponse = IBaseResponse<{ application: IApplication }>;
export type IAdminApplicationResponse = IBaseResponse<{
  application: IAdminApplication;
}>;
