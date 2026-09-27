import { IBaseResponse } from "@/types/BaseResponse";
import type { IOwnerCandidate } from "@/apis/organization-application/models/application";
import type { OrgMemberRole } from "./organization";
import type { IMember } from "./organizationMembers";

export type InvitationStatus =
  | "PENDING_APPROVAL"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface IInvitationPerson {
  id: string;
  name: string;
  avatar: string | null;
}

export interface IOrgInvitation {
  id: string;
  organization_id: string;
  role: OrgMemberRole;
  status: InvitationStatus;
  inviter: IInvitationPerson;
  /** Email masked unless the viewer may approve invitations. */
  invitee: IInvitationPerson & { email: string };
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string | null;
  responded_at: string | null;
  created_at: string;
}

/** A person found by the member / owner pickers. */
export interface IUserSearchResult {
  id: string;
  name: string;
  avatar: string | null;
  /** Masked (`ng***@gmail.com`) unless the viewer may propose owners. */
  email: string;
  is_member: boolean;
  role: OrgMemberRole | null;
}

export interface IInvitationSummary {
  status: InvitationStatus;
  active: boolean;
  expired: boolean;
  expires_at: string | null;
  role: OrgMemberRole;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
  };
  inviter_name: string;
  invitee_name: string;
  invitee_email: string;
  session_mismatch: boolean;
}

export type OwnerChangeType = "ADD_OWNER" | "REMOVE_OWNER";
export type OwnerApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
/** Role kept by the owner stepping out; null = leaves the organization. */
export type OwnerDemoteRole = "ADMIN" | "MEMBER" | null;

export interface IOwnerChangePerson {
  user_id: string;
  name: string | null;
  avatar: string | null;
}

export interface IOwnerChangeApproval extends IOwnerChangePerson {
  status: OwnerApprovalStatus;
  note: string | null;
  decided_at: string | null;
  expires_at: string;
  /** The approver stopped being an owner; their answer no longer counts. */
  void: boolean;
}

/** ADD_OWNER / REMOVE_OWNER, decided by the organization's owners. */
export interface IOwnerChange {
  id: string;
  code: string;
  type: OwnerChangeType;
  status: string;
  reason: string | null;
  review_note: string | null;
  reject_reason: string | null;
  proposer: IOwnerChangePerson & { email: string };
  target: IOwnerChangePerson | null;
  demote_to: OwnerDemoteRole;
  owners: IOwnerCandidate[];
  confirmed_count: number;
  approvals: IOwnerChangeApproval[];
  my_approval: OwnerApprovalStatus | null;
  can_cancel: boolean;
  created_at: string;
  reviewed_at: string | null;
}

export interface IOwnerProposalInput {
  user_id?: string;
  email?: string;
  full_name: string;
}

export type IChangeMemberRoleResponse = IBaseResponse<{ member: IMember }>;
export type IUserSearchResponse = IBaseResponse<{ users: IUserSearchResult[] }>;
export type IInvitationResponse = IBaseResponse<{ invitation: IOrgInvitation }>;
export type IInvitationsResponse = IBaseResponse<{ invitations: IOrgInvitation[] }>;
export type IInvitationSummaryResponse = IBaseResponse<{
  invitation: IInvitationSummary;
}>;
export type IAcceptInvitationResponse = IBaseResponse<{ organization_slug: string }>;
export type IOwnerChangeResponse = IBaseResponse<{ change: IOwnerChange }>;
export type IOwnerChangesResponse = IBaseResponse<{ changes: IOwnerChange[] }>;
export type IEmptyResponse = IBaseResponse<unknown>;
