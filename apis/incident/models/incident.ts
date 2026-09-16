import { IUser } from "@/apis/auth/models/user";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export type SortBy =
  | "created_at"
  | "updated_at"
  | "severity_level"
  | "distance"
  | "name";

export interface IMediaFiles {
  id: string;
  media_id: string;
  url: string;
  ai_analysis_url: string | null;
  uploaded_by: string;
  created_at: string;
}

/** Organization handling the report (`report.campaign_id` → campaign → organization). */
export interface IIncidentHandledBy {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  background_url: string | null;
  contact_email: string | null;
}

/** Media pair that triggered a duplicate match. */
export interface IDuplicateNewMedia {
  media_id: string;
  url: string | null;
}

export interface IDuplicateOldMedia {
  duplicate_media_id: string;
  duplicate_url: string | null;
}

export interface IDuplicateMediaMatch {
  new_media: IDuplicateNewMedia;
  duplicate_media: IDuplicateOldMedia;
}

/** One older report and the media pairs that matched it. */
export interface IDuplicateVerification {
  duplicate_report_id: string;
  title: string | null;
  detail_address: string | null;
  status: number | null;
  matches: IDuplicateMediaMatch[];
}

export interface IIncident {
  id: string;
  user_id: string | null;
  title: string | null;
  title_vi?: string | null;
  title_en?: string | null;
  description: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  waste_type: string | null;
  condition?: string | null;
  severity_level: number | null;
  latitude: number | null;
  longitude: number | null;
  status: number | null;
  ai_verified: boolean;
  /** Admin verification; only admins can set true. */
  is_verify?: boolean;
  /** Admin ban reason; `null`/empty when the report has not been banned. */
  reject_reason?: string | null;
  /** AI recommendation in markdown (nullable until analysis completes). */
  ai_recommendation?: string | null;
  /**
   * Null until the AI worker writes back; empty array means unique.
   */
  duplicate_verification?: IDuplicateVerification[] | null;
  created_at: string;
  updated_at: string;
  distance: number;
  image_urls?: string[];
  media_files?: IMediaFiles[];
  user?: IUser;
  detail_address?: string;
  votes?: {
    downvote_count?: number;
    my_vote?: number;
    upvote_count?: number;
  };
  saved?: boolean;
  handled_by?: IIncidentHandledBy | null;
}
