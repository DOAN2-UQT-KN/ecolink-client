import { ICreateOrganizationRequest } from "@/apis/organization/models/createOrganization";

/** Empty string, pasted URL, or a file picked in the form (uploaded on submit). */
export type OrganizationImageSource = string | File | Blob;

export interface OrganizationFormValues {
  name: string;
  description: string;
  logoUrl: OrganizationImageSource;
  backgroundUrl: OrganizationImageSource;
  contactEmail: string;
}

export function toCreateOrganizationRequest(params: {
  name: string;
  description: string;
  contact_email: string;
  logo_url: string;
  background_url: string;
}): ICreateOrganizationRequest {
  return {
    name: params.name.trim(),
    description: params.description.trim(),
    logo_url: params.logo_url.trim(),
    background_url: params.background_url.trim(),
    contact_email: params.contact_email.trim(),
  };
}
