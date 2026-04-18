import { IBaseResponse } from "@/types/BaseResponse";
import { IJoinRequest } from "./joinRequest";

export interface IGetMyJoinRequestsRequest {
  organization_id?: string;
  status?: number;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export type IGetMyJoinRequestsResponse = IBaseResponse<{
  join_requests: IJoinRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;

export interface IProcessJoinRequestRequest {
  request_id: string;
  approved: boolean;
}

export type IProcessJoinRequestResponse = IBaseResponse<{
  join_request: IJoinRequest;
}>;

export interface ICancelJoinRequestRequest {
  request_id: string;
}

export type ICancelJoinRequestResponse = IBaseResponse<unknown>;

/** Nested `joinRequest` from POST /organizations/:id/join-requests (camelCase). */
export interface IOrganizationJoinRequestCreated {
  id: string;
  organizationId: string;
  requesterId: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export type ICreateOrganizationJoinRequestResponse = IBaseResponse<{
  joinRequest: IOrganizationJoinRequestCreated;
}>;
