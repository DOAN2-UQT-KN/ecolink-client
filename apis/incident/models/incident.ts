export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export type SortBy = "createdAt" | "updatedAt" | "severityLevel" | "distance";

export interface IIncident {
  id: string;
  userId: string | null;
  title: string | null;
  description: string | null;
  wasteType: string | null;
  severityLevel: number | null;
  latitude: number | null;
  longitude: number | null;
  status: number | null;
  aiVerified: boolean;
  createdAt: string;
  updatedAt: string;
  distance: number;
  imageUrls?: string[];
}
