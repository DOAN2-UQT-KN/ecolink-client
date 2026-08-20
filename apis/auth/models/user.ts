import { IBaseResponse } from "@/types/BaseResponse";

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  phone_number?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  date_of_birth?: string | null;
  roleId: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Last-known location (self profile / auth me only; omitted for other users). */
  latitude?: number | null;
  longitude?: number | null;
  locationUpdatedAt?: string | null;
  detail_address?: string | null;
  notification_preferences?: Record<string, boolean>;
  notificationPreferences?: Record<string, boolean>;
}

export interface IGetMeResponse extends IBaseResponse<{ user: IUser }> {}
