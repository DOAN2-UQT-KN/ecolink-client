import { IBaseResponse } from "@/types/BaseResponse";
import { IJoinRequest } from "./joinRequest";

export interface IGetMyJoinRequestsRequest {
  organizationId?: string;
  status?: number;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export type IGetMyJoinRequestsResponse = IBaseResponse<{
  joinRequests: IJoinRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

export interface IProcessJoinRequestRequest {
  requestId: string;
  approved: boolean;
}

export type IProcessJoinRequestResponse = IBaseResponse<{
  joinRequest: IJoinRequest;
}>;

export interface ICancelJoinRequestRequest {
  requestId: string;
}

export type ICancelJoinRequestResponse = IBaseResponse<any>;
