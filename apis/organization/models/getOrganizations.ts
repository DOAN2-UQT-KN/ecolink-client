import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IGetOrganizationsRequest {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at" | "name";
  sort_order?: "asc" | "desc";
}

export type IGetOrganizationsResponse = IBaseResponse<{
  organizations: IOrganization[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
