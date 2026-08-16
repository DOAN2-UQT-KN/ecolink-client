import { IUser } from "@/apis/auth/models/user";

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  logo_url: string | null;
  background_url: string | null;
  contact_email: string | null;
  is_email_verified: boolean;
  status: number;
  /** Admin reject reason; `null`/empty when the organization has not been rejected. */
  reject_reason?: string | null;
  owner_id: string;
  /** True when the signed-in user is an active member of this org. */
  is_member?: boolean;
  created_at: string;
  updated_at: string;
  request_status?: number;
  /** Present when the current user has a join request; required to cancel while pending. */
  join_request_id?: string;
  owner: Pick<IUser, "id" | "name" | "email" | "avatar">;
}
