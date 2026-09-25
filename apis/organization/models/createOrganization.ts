/**
 * Body of the internal-only POST /api/v1/organizations. Kept because the owner edit form
 * reuses this shape; the browser no longer calls that endpoint — organizations are founded
 * through `apis/organization-application`.
 */
import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface ICreateOrganizationRequest {
  name: string;
  description: string;
  logo_url: string;
  background_url: string;
  contact_email: string;
}

export type ICreateOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;
