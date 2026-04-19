import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IGetMyOrganizationsRequest {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at" | "name";
  sort_order?: "asc" | "desc";
  is_email_verified?: boolean;
  status?: number;
  /** Single value or multiple (serialized as comma-separated query) */
  request_status?: number | number[];
  is_owner?: boolean;
}

export type IGetMyOrganizationsResponse = IBaseResponse<{
  organizations: IOrganization[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
