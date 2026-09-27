import type {
  ApplicationDocType,
  IApplication,
  LegalRepIdType,
  OrganizationChannelType,
  OrgType,
} from "@/apis/organization-application/models/application";
import type { ISaveApplicationRequest } from "@/apis/organization-application/models/saveApplication";

/** Empty string, a pasted URL, or a file picked in the form (uploaded on submit). */
export type ApplicationImageSource = string | File | Blob;

export interface ApplicationChannelValue {
  type: OrganizationChannelType;
  url: string;
}

/** One row of the owner list. Every owner confirms by email before the application is reviewed. */
export interface ApplicationOwnerValue {
  email: string;
  fullName: string;
  isLegalRep: boolean;
}

/** Owners per application; matches the 5-document limit on the server. */
export const MAX_OWNERS = 5;

/** A document already uploaded to private storage; only its id travels with the submission. */
export interface ApplicationDocumentValue {
  documentId: string;
  fileName: string;
  docType: ApplicationDocType;
  /** From the picked `File`; only used to pick the file-type icon, never sent to the API. */
  mimeType: string;
}

export interface ApplicationFormValues {
  /* Email gate — mailbox ownership (new application only) */
  email: string;
  otp: string;

  /* Public profile */
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

  /* Contact */
  /** The organization's public contact address; defaults to the submitter's email. */
  contactEmail: string;
  channels: ApplicationChannelValue[];

  /* Owners, and KYC of the one marked legal representative (review-only) */
  owners: ApplicationOwnerValue[];
  legalRepIdType: LegalRepIdType;
  /** Left empty, the number saved earlier is kept. */
  legalRepIdNumber: string;
  legalRepPhone: string;
  legalRepPosition: string;

  /* Paperwork uploaded in this session (already attached ones live on the application) */
  documents: ApplicationDocumentValue[];

  /* Review */
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
  contactEmail: "",
  channels: [{ type: "FACEBOOK_PAGE", url: "" }],
  owners: [],
  legalRepIdType: "CCCD",
  legalRepIdNumber: "",
  legalRepPhone: "",
  legalRepPosition: "",
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

/** Prefills the editor from the saved draft. The ID number is never returned, only its last 4. */
export function applicationToFormValues(
  application: IApplication,
): ApplicationFormValues {
  const { profile } = application;
  const rep = application.legal_representative;
  return {
    ...DEFAULT_APPLICATION_FORM_VALUES,
    email: application.submitter_email,
    orgType: application.org_type ?? "",
    name: profile.name ?? "",
    description: profile.description ?? "",
    address: profile.address ?? "",
    latitude: profile.latitude ?? undefined,
    longitude: profile.longitude ?? undefined,
    logo: profile.logo_url ?? "",
    background: profile.background_url ?? "",
    contactEmail: profile.contact_email ?? application.submitter_email,
    channels: application.channels.length
      ? application.channels.map((channel) => ({
          type: channel.type,
          url: channel.url,
        }))
      : DEFAULT_APPLICATION_FORM_VALUES.channels,
    owners: application.owners.map((owner) => ({
      email: owner.email,
      fullName: owner.full_name,
      isLegalRep: owner.is_legal_rep,
    })),
    legalRepIdType: rep.id_type ?? "CCCD",
    legalRepIdNumber: "",
    legalRepPhone: rep.phone ?? "",
    legalRepPosition: rep.position ?? "",
    consent: Boolean(application.consented_at),
  };
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Same rules the server applies on submit, checked in the form first so the applicant sees
 * them next to the list instead of as a toast. Returns an i18n key, or true.
 */
export function validateOwnerList(
  owners: ApplicationOwnerValue[],
  submitterEmail: string,
): true | string {
  if (owners.length === 0) return "Add at least one owner";
  if (owners.length > MAX_OWNERS) return "An application can have at most 5 owners";
  const emails = owners.map((owner) => normalizeEmail(owner.email));
  if (new Set(emails).size !== emails.length) {
    return "The same email is listed twice in the owner list";
  }
  if (!emails.includes(normalizeEmail(submitterEmail))) {
    return "You must be one of the owners";
  }
  if (owners.filter((owner) => owner.isLegalRep).length !== 1) {
    return "Choose exactly one owner as the legal representative";
  }
  return true;
}

/**
 * Everything the draft save sends. Images must already be URLs: the caller uploads picked
 * files to Cloudinary first.
 */
export function toSaveApplicationRequest(params: {
  id: string;
  token: string;
  values: ApplicationFormValues;
  logoUrl: string;
  backgroundUrl: string;
  removeDocumentIds: string[];
}): ISaveApplicationRequest {
  const { values, logoUrl, backgroundUrl } = params;
  const idNumber = values.legalRepIdNumber.trim();

  return {
    id: params.id,
    token: params.token,
    org_type: values.orgType,
    profile: {
      name: values.name.trim(),
      contact_email: normalizeEmail(values.contactEmail) || null,
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
    owners: values.owners
      .filter((owner) => owner.email.trim())
      .map((owner) => ({
        email: normalizeEmail(owner.email),
        full_name: owner.fullName.trim(),
        is_legal_rep: owner.isLegalRep,
      })),
    legal_representative: {
      id_type: values.legalRepIdType,
      // Left empty, the server keeps the number saved earlier.
      ...(idNumber ? { id_number: idNumber } : {}),
      phone: values.legalRepPhone.trim() || null,
      position: values.legalRepPosition.trim() || null,
    },
    document_ids: values.documents.map((document) => document.documentId),
    remove_document_ids: params.removeDocumentIds,
    consent: values.consent,
  };
}
