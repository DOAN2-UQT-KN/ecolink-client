export interface IOrganization {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  isEmailVerified: boolean;
  status: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
