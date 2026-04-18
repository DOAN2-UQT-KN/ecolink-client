import { IBaseResponse } from "@/types/BaseResponse";
import { IJoinRequest } from "./joinRequest";

export type ICreateJoinRequestResponse = IBaseResponse<{
  join_request: IJoinRequest;
}>;

export interface IGetJoinRequestsByOrgRequest {
  status?: number;
  requester_id?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export type IGetJoinRequestsByOrgResponse = IBaseResponse<{
  join_requests: IJoinRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
