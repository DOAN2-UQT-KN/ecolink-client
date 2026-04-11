import { IUser } from "@/apis/auth/models/user";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export type SortBy =
  | "created_at"
  | "updated_at"
  | "severity_level"
  | "distance";

export interface IMediaFiles {
  id: string;
  media_id: string;
  url: string;
  ai_analysis_url: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface IIncident {
  id: string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  waste_type: string | null;
  severity_level: number | null;
  latitude: number | null;
  longitude: number | null;
  status: number | null;
  ai_verified: boolean;
  size?: string;
  condition?: string;
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
}
