import { IBaseResponse } from "@/types/BaseResponse";
import { IJoinRequest } from "./joinRequest";

export type ICreateJoinRequestResponse = IBaseResponse<{
  joinRequest: IJoinRequest;
}>;

export interface IGetJoinRequestsByOrgRequest {
  status?: number;
  requesterId?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export type IGetJoinRequestsByOrgResponse = IBaseResponse<{
  joinRequests: IJoinRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
