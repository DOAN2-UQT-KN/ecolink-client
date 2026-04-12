import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IGetOrganizationsRequest {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at" | "name";
  sort_order?: "asc" | "desc";
  is_email_verified?: boolean;
  status?: number;
  request_status?: number;
}

export type IGetOrganizationsResponse = IBaseResponse<{
  organizations: IOrganization[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
