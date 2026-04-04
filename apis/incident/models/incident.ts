export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export type SortBy = "created_at" | "updated_at" | "severity_level" | "distance";

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
  created_at: string;
  updated_at: string;
  distance: number;
  image_urls?: string[];
}
