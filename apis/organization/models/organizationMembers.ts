import { IUser } from "@/apis/auth/models/user";
import { IBaseResponse } from "@/types/BaseResponse";

export interface IMember {
  organization_id: string;
  user_id: string;
  user: Pick<IUser, "id" | "name" | "email" | "avatar">;
  created_at: string;
}

export interface IGetMembersRequest {
  organization_id: string;
  search?: string;
  user_id?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
  name?: string;
}

export type IGetMembersResponse = IBaseResponse<{
  members: IMember[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
