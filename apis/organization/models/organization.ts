export interface IOrganization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  background_url: string | null;
  contact_email: string | null;
  is_email_verified: boolean;
  status: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  request_status?: number;
  /** Present when the current user has a join request; required to cancel while pending. */
  join_request_id?: string;
}
