import { IOrganization } from "./organization";

export interface IJoinRequest {
  id: string;
  organization_id: string;
  requester_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  organization?: Pick<IOrganization, "id" | "name" | "owner_id">;
}
