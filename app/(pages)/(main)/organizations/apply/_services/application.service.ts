import type {
  ApplicationDocType,
  LegalRepIdType,
  OrganizationChannelType,
  OrgType,
} from "@/apis/organization-application/models/application";
import type { ICreateApplicationRequest } from "@/apis/organization-application/models/createApplication";

/** Empty string, a pasted URL, or a file picked in the form (uploaded on submit). */
export type ApplicationImageSource = string | File | Blob;

export interface ApplicationChannelValue {
  type: OrganizationChannelType;
  url: string;
}

/** A document already uploaded to private storage; only its id travels with the submission. */
export interface ApplicationDocumentValue {
  documentId: string;
  fileName: string;
  docType: ApplicationDocType;
}

export interface ApplicationFormValues {
  /* Step 1 — mailbox ownership */
  email: string;
  otp: string;

  /* Step 2 — public profile */
  orgType: OrgType | "";
  name: string;
  description: string;
  /** Filled by the map picker via reverse geocoding, or typed through its search box. */
  address: string;
  /** Set together with `address` whenever a point is picked; both stay undefined otherwise. */
  latitude?: number;
  longitude?: number;
  logo: ApplicationImageSource;
  background: ApplicationImageSource;

  /* Step 3 — channels + legal representative (review-only) */
  channels: ApplicationChannelValue[];
  legalRepFullName: string;
  legalRepIdType: LegalRepIdType;
  legalRepIdNumber: string;
  legalRepPhone: string;
  legalRepPosition: string;
  legalRepEmail: string;

  /* Step 4 — paperwork */
  documents: ApplicationDocumentValue[];

  /* Step 5 — review */
  consent: boolean;
}

export const DEFAULT_APPLICATION_FORM_VALUES: ApplicationFormValues = {
  email: "",
  otp: "",
  orgType: "",
  name: "",
  description: "",
  address: "",
  latitude: undefined,
  longitude: undefined,
  logo: "",
  background: "",
  channels: [{ type: "FACEBOOK_PAGE", url: "" }],
  legalRepFullName: "",
  legalRepIdType: "CCCD",
  legalRepIdNumber: "",
  legalRepPhone: "",
  legalRepPosition: "",
  legalRepEmail: "",
  documents: [],
  consent: false,
};

export const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: "SCHOOL", label: "School / University" },
  { value: "GOV", label: "Government body" },
  { value: "CLUB", label: "Club" },
  { value: "NGO", label: "NGO" },
  { value: "SOCIAL_ENTERPRISE", label: "Social enterprise" },
];

export const CHANNEL_TYPE_OPTIONS: {
  value: OrganizationChannelType;
  label: string;
}[] = [
  { value: "FACEBOOK_PAGE", label: "Facebook page" },
  { value: "WEBSITE", label: "Website" },
  { value: "ZALO_OA", label: "Zalo OA" },
];

export const LEGAL_REP_ID_TYPE_OPTIONS: {
  value: LegalRepIdType;
  label: string;
}[] = [
  { value: "CCCD", label: "Citizen ID" },
  { value: "MSSV", label: "Student ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "OTHER", label: "Other" },
];

export const DOC_TYPE_OPTIONS: { value: ApplicationDocType; label: string }[] = [
  { value: "ESTABLISHMENT_DECISION", label: "Establishment decision" },
  { value: "BUSINESS_LICENSE", label: "Business licence" },
  { value: "REP_ID_CARD", label: "Representative ID" },
  { value: "OTHER", label: "Other" },
];

/**
 * Organizations that usually run on an official domain. Selecting one only changes the hint
 * we show — it never skips the upload step. Letting a self-declared type waive paperwork
 * would mean anyone with a Gmail address could tick "school" and sail through.
 */
export const DOMAIN_HINT_ORG_TYPES: OrgType[] = ["SCHOOL", "GOV"];

export function toCreateApplicationRequest(params: {
  values: ApplicationFormValues;
  logoUrl: string;
  backgroundUrl: string;
}): ICreateApplicationRequest {
  const { values, logoUrl, backgroundUrl } = params;

  return {
    org_type: values.orgType as OrgType,
    profile: {
      name: values.name.trim(),
      contact_email: values.email.trim().toLowerCase(),
      logo_url: logoUrl.trim(),
      background_url: backgroundUrl.trim() || null,
      address: values.address.trim() || null,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      description: values.description.trim() || null,
    },
    channels: values.channels
      .filter((channel) => channel.url.trim())
      .map((channel, index) => ({
        type: channel.type,
        url: channel.url.trim(),
        is_primary: index === 0,
      })),
    legal_representative: values.legalRepFullName.trim()
      ? {
          full_name: values.legalRepFullName.trim(),
          id_type: values.legalRepIdType,
          id_number: values.legalRepIdNumber.trim(),
          phone: values.legalRepPhone.trim(),
          position: values.legalRepPosition.trim() || null,
          email: values.legalRepEmail.trim().toLowerCase() || null,
        }
      : undefined,
    document_ids: values.documents.map((document) => document.documentId),
    consent: values.consent,
  };
}
