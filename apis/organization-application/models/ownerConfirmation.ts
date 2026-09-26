import { IBaseResponse } from "@/types/BaseResponse";
import { ApplicationStatus, OrgType, OwnerCandidateStatus } from "./application";

export interface IOwnerConfirmationPerson {
  email: string;
  full_name: string;
  is_legal_rep: boolean;
}

/** What the public confirmation page shows to one owner candidate. */
export interface IOwnerConfirmation {
  status: OwnerCandidateStatus;
  application_status: ApplicationStatus;
  /** False once the application no longer waits on confirmations (withdrawn, decided...). */
  active: boolean;
  expired: boolean;
  expires_at: string | null;
  application_code: string;
  /** `ADD_OWNER`: joining an existing organization as an owner. */
  application_type: "NEW_ORG" | "ADD_OWNER";
  organization: {
    name: string | null;
    org_type: OrgType | null;
    address: string | null;
    logo_url: string | null;
    description: string | null;
  };
  submitter_email: string;
  candidate: IOwnerConfirmationPerson;
  other_owners: IOwnerConfirmationPerson[];
  /** Signed in with a different email than the candidate's. */
  session_email_mismatch: boolean;
}

export type IGetOwnerConfirmationResponse = IBaseResponse<{
  confirmation: IOwnerConfirmation;
}>;

export type IConfirmOwnerResponse = IBaseResponse<{
  already_done: boolean;
  remaining: number;
  application_status: ApplicationStatus;
}>;

export interface IDeclineOwnerRequest {
  token: string;
  reason?: string | null;
  block_future?: boolean;
}

export type IDeclineOwnerResponse = IBaseResponse<{
  application_status: ApplicationStatus;
}>;
