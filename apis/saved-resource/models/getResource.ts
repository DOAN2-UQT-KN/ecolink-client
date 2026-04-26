import { IPaginationResponse } from "@/types/PaginationResponse";

export interface IGetResourceRequest {
  page?: number;
  limit?: number;
  resource_type?: string; //"report"
  sort_by?: string;
  sort_order?: string;
}

export interface IResource {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface IGetResourceResponse extends IPaginationResponse<IResource, "data"> {}