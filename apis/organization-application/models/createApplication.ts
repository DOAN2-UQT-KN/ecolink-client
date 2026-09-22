import {
  IApplicationChannel,
  IApplicationProfile,
  LegalRepIdType,
  OrgType,
} from "./application";

/**
 * Review-only. The raw ID number is sent once and never stored: the server keeps a hash plus
 * the last 4 characters, and no endpoint ever returns it.
 */
export interface ILegalRepresentativeInput {
  full_name: string;
  id_type: LegalRepIdType;
  id_number: string;
  phone: string;
  position?: string | null;
  email?: string | null;
}

export interface ICreateApplicationRequest {
  org_type: OrgType;
  profile: IApplicationProfile;
  channels: IApplicationChannel[];
  legal_representative?: ILegalRepresentativeInput;
  document_ids?: string[];
  /** Consent to personal data processing; the server refuses the submission without it. */
  consent: boolean;
}

export interface IUpdateApplicationRequest
  extends Partial<Omit<ICreateApplicationRequest, "consent">> {
  id: string;
  token: string;
}
