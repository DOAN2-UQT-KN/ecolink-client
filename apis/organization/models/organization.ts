import { IUser } from "@/apis/auth/models/user";
import type {
  OrganizationChannelType,
  OrgType,
} from "@/apis/organization-application/models/application";

export type KycStatus = "NOT_SUBMITTED" | "APPROVED" | "EXPIRED" | "REVOKED";
export type TrustTier = "NONE" | "BASIC" | "VERIFIED";

export interface IOrganizationChannel {
  id: string;
  type: OrganizationChannelType;
  url: string;
  is_primary: boolean;
}

/** Mirrors `OrgMemberRole` on the server. */
export type OrgMemberRole =
  | "LEGAL_REPRESENTATIVE"
  | "OWNER"
  | "ADMIN"
  | "CAMPAIGN_MANAGER"
  | "MEMBER";

export const OWNER_ROLES: OrgMemberRole[] = ["LEGAL_REPRESENTATIVE", "OWNER"];

export interface IOrganizationOwner extends Pick<IUser, "id" | "name" | "avatar"> {
  role: OrgMemberRole;
}

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  logo_url: string | null;
  background_url: string | null;
  contact_email: string | null;
  is_email_verified: boolean;
  status: number;
  /** Admin ban reason; `null`/empty when the organization has not been banned. */
  reject_reason?: string | null;
  /** Kind of legal entity, confirmed by an admin when the application was approved. */
  org_type?: OrgType | null;
  /** Verdict on the legal paperwork. Independent of `trust_tier`. */
  kyc_status?: KycStatus;
  /** Blue Tick level. `VERIFIED` is the badge; approved paperwork alone does not grant it. */
  trust_tier?: TrustTier;
  /** True while a violation is being handled: the badge is hidden. */
  tick_suspended?: boolean;
  verified_at?: string | null;
  /** Lane B ticks expire and must be re-assessed; `null` for lane A. */
  verification_expires_at?: string | null;
  address?: string | null;
  /** Inherited from the approved application; null when the applicant skipped the map. */
  latitude?: number | null;
  longitude?: number | null;
  channels?: IOrganizationChannel[];
  /**
   * People with an owner role. An organization never logs in: these are the users who act
   * for it. Never empty for an active organization.
   */
  owners: IOrganizationOwner[];
  /** The signed-in user's role here (`OrgMemberRole`), or null when not a member. */
  my_role?: OrgMemberRole | null;
  /** True when the signed-in user holds an owner role. */
  is_owner?: boolean;
  /** True when the signed-in user holds any active membership (owners included). */
  is_member?: boolean;
  /** Active member count, owners included. */
  members?: number;
  created_at: string;
  updated_at: string;
  request_status?: number;
  /** Present when the current user has a join request; required to cancel while pending. */
  join_request_id?: string;
}
