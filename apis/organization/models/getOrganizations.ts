import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IGetOrganizationsRequest {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}

export type IGetOrganizationsResponse = IBaseResponse<{
  organizations: IOrganization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
