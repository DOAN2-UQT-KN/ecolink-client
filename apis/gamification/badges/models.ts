import type { IBaseResponse } from "@/types/BaseResponse";

export interface IBadgeDefinition {
  id: string;
  slug: string;
  name: string;
  symbol?: string | null;
  category: string;
  scope: string;
  isRepeatable: boolean;
  maxGrantsPerUser: number | null;
  cooldownSeconds: number;
  rulesConfig?: Record<string, unknown> | null;
  reward?: Record<string, unknown> | null;
}

export interface IAdminBadgeDefinition extends IBadgeDefinition {
  isActive: boolean;
  publishedAt: string | null;
  slugLockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IGamificationBadgeGrant {
  id: string;
  grantedAt: string;
  metadata?: Record<string, unknown> | null;
  season: {
    id: string;
    label: string | null;
    kind: string;
    status: string;
  } | null;
  badge: IBadgeDefinition;
}

export interface IGetMyGamificationBadgesRequest {
  seasonId?: string;
}

export interface IGetAdminGamificationBadgesRequest {
  includeInactive?: boolean;
}

export interface ICreateAdminBadgeBody {
  slug?: string;
  name: string;
  symbol?: string | null;
  category: string;
  scope?: string;
  isRepeatable?: boolean;
  maxGrantsPerUser?: number | null;
  cooldownSeconds?: number;
  rulesConfig?: Record<string, unknown> | null;
  reward?: Record<string, unknown> | null;
  isActive?: boolean;
  publishedAt?: string | null;
}

export interface IPatchAdminBadgeBody {
  name?: string;
  symbol?: string | null;
  category?: string;
  scope?: string;
  isRepeatable?: boolean;
  maxGrantsPerUser?: number | null;
  cooldownSeconds?: number;
  rulesConfig?: Record<string, unknown> | null;
  reward?: Record<string, unknown> | null;
  isActive?: boolean;
  deletedAt?: string | null;
  publishedAt?: string;
}

export type IGetMyGamificationBadgesResponse = IBaseResponse<{
  badges: IGamificationBadgeGrant[];
}>;

export type IGetAdminGamificationBadgesResponse = IBaseResponse<{
  badges: IAdminBadgeDefinition[];
}>;

export type ICreateAdminBadgeResponse = IBaseResponse<{
  badge: IAdminBadgeDefinition;
}>;

export type IPatchAdminBadgeResponse = IBaseResponse<{
  badge: IAdminBadgeDefinition;
}>;
