import { IOrganization } from "./organization";

export interface IJoinRequest {
  id: string;
  organizationId: string;
  requesterId: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  organization?: Pick<IOrganization, "id" | "name" | "ownerId">;
}
