import { IBaseResponse } from "@/types/BaseResponse";

export interface IAdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  phone_number?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  date_of_birth?: string | null;
  role_id: string;
  role_name: string | null;
  email_verified: boolean;
  status: number;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  location_updated_at?: string | null;
  detail_address?: string | null;
  notification_preferences?: Record<string, boolean>;
}

export interface IGetUsersRequest {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "name" | "email";
  sort_order?: "asc" | "desc";
  status?: number;
}

export type IGetUsersResponse = IBaseResponse<{
  users: IAdminUser[];
  total: number;
  page: number;
  limit: number;
}>;
