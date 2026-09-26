import {
  IApplicationChannel,
  IApplicationProfile,
  LegalRepIdType,
  OrgType,
} from "./application";

/**
 * KYC for the owner marked as legal representative. The raw ID number is sent once and never
 * stored: the server keeps a hash plus the last 4 characters. Omit `id_number` to keep the
 * number saved earlier.
 */
export interface ILegalRepresentativeInput {
  id_type?: LegalRepIdType | null;
  id_number?: string | null;
  phone?: string | null;
  position?: string | null;
}

export interface IOwnerCandidateInput {
  email: string;
  full_name: string;
  is_legal_rep: boolean;
  national_id_document_id?: string | null;
}

/** Draft save: every field optional, only what is sent changes. */
export interface ISaveApplicationRequest {
  id: string;
  token: string;
  org_type?: OrgType | "";
  profile?: IApplicationProfile;
  channels?: IApplicationChannel[];
  legal_representative?: ILegalRepresentativeInput;
  /** The full owner list; rows left out are marked removed on the server. */
  owners?: IOwnerCandidateInput[];
  document_ids?: string[];
  remove_document_ids?: string[];
  consent?: boolean;
  /** Only on "Save draft": mail the submitter a "draft updated" notice (max once an hour). */
  notify_submitter?: boolean;
}

export interface ISubmitApplicationRequest {
  id: string;
  token: string;
  consent?: boolean;
}

export interface IResendOwnerInviteRequest {
  id: string;
  token: string;
  candidateId: string;
}
