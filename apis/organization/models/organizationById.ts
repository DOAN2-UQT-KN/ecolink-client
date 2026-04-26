import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";
import { IMember } from "./organizationMembers";
import { IPaginationResponse } from "@/types/PaginationResponse";

export interface IUpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  background_url?: string;
  contact_email?: string;
}

export type IGetOrganizationByIdResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IUpdateOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IVerifyOrganizationRequest = {
  status?: number;
  id: string;
};

export type IVerifyOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IResendContactEmailResponse = IBaseResponse<{
  organization: IOrganization;
}>;


export interface IGetMembersRequest {
  organization_id: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export type IGetMembersResponse = IPaginationResponse<IMember[], "members">   
