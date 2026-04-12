import { IBaseResponse } from "@/types/BaseResponse";

export interface IMember {
  organizationId: string;
  userId: string;
  createdAt: string;
}

export interface IGetMembersRequest {
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export type IGetMembersResponse = IBaseResponse<{
  members: IMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
