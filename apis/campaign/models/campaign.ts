import type { IUser } from '@/apis/auth/models/user';
import { IIncident } from '@/apis/incident/models/incident';

export interface ICampaign {
  id: string;
  organization_id?: string;
  title: string;
  title_vi?: string | null;
  title_en?: string | null;
  description: string;
  description_vi?: string | null;
  description_en?: string | null;

  status?: number;
  difficulty?: number;
  green_points?: number;

  is_verify?: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string; // ISO date
  updated_at: string; // ISO date

  report_ids?: string[];
  manager_ids?: string[];

  votes?: {
    upvote_count?: number;
    downvote_count?: number;
    my_vote?: number | null;
  };

  completion_verification?: {
    clean_count?: number;
    not_clean_count?: number;
    my_verification?: number | null;
  };

  saved?: boolean;
  request_status?: number;
  /** Present when the current user has a join request; used to cancel while pending. */
  join_request_id?: string;

  banner?: string;
  detail_address?: string;
  start_date?: string;
  end_date?: string;

  current_members?: number;
  max_members?: number;

  /** Campaign owner; may be omitted in some responses; see also `created_by` */
  owner?: Pick<IUser, 'id' | 'name' | 'email' | 'avatar'> | null;

  /** Creator or assigned campaign manager (from GET campaign when authenticated). */
  can_manage_campaign?: boolean;

  /** Populated by admin-facing endpoints */
  organization?: {
    id: string;
    name: string;
    slug?: string | null;
    logo_url?: string | null;
    contact_email?: string | null;
  } | null;

  reports?: IIncident[];
}
