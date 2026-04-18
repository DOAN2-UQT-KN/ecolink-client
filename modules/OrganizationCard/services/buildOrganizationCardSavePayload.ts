import type {
  OrganizationCardAssetChange,
  OrganizationCardSavePayload,
} from "../types/OrganizationCard.types";

export function buildOrganizationCardSavePayload(
  name: string,
  description: string,
  contactEmail: string,
  logo: OrganizationCardAssetChange,
  background: OrganizationCardAssetChange,
): OrganizationCardSavePayload {
  return {
    name: name.trim(),
    description: description.trim(),
    contactEmail: contactEmail.trim(),
    logo,
    background,
  };
}
