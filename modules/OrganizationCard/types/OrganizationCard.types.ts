export type OrganizationCardAssetChange =
  | { unchanged: true }
  | { file: File };

export interface OrganizationCardSavePayload {
  name: string;
  description: string;
  contactEmail: string;
  logo: OrganizationCardAssetChange;
  background: OrganizationCardAssetChange;
}
