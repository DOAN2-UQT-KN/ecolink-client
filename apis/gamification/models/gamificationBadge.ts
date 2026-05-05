import type { IBaseResponse } from '@/types/BaseResponse';

/** Badge shape embedded in user grant payloads (subset of columns). */
export interface IBadgeDefinition {
  id: string;
  slug: string;
  name: string;
  symbol?: string | null;
  category: string;
  ruleType: string;
  metric: string;
  threshold: number | null;
  rankTopN: number | null;
  reward?: Record<string, unknown> | null;
}

/** Full admin list row — matches reward-service `BadgeDefinition` JSON. */
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
  };
  badge: IBadgeDefinition;
}

export interface IGetMyGamificationBadgesRequest {
  seasonId?: string;
}

export type IGetMyGamificationBadgesResponse = IBaseResponse<{
  badges: IGamificationBadgeGrant[];
}>;

export interface IGetAdminGamificationBadgesRequest {
  /** When true, query sends `includeInactive=true` (backend lists soft-deleted / inactive where applicable). */
  includeInactive?: boolean;
}

export type IGetAdminGamificationBadgesResponse = IBaseResponse<{
  badges: IAdminBadgeDefinition[];
}>;

/** POST /api/v1/admin/gamification/badges */
export interface ICreateAdminBadgeBody {
  slug?: string;
  name: string;
  symbol?: string | null;
  category: string;
  ruleType: string;
  metric: string;
  threshold?: number | null;
  rankTopN?: number | null;
  reward?: Record<string, unknown> | null;
  isActive?: boolean;
  publishedAt?: string | null;
}

export type ICreateAdminBadgeResponse = IBaseResponse<{
  badge: IAdminBadgeDefinition;
}>;

/** PATCH /api/v1/admin/gamification/badges/:id */
export interface IPatchAdminBadgeBody {
  name?: string;
  symbol?: string | null;
  category?: string;
  ruleType?: string;
  metric?: string;
  threshold?: number | null;
  rankTopN?: number | null;
  reward?: Record<string, unknown> | null;
  isActive?: boolean;
  deletedAt?: string | null;
  publishedAt?: string;
}

export type IPatchAdminBadgeResponse = IBaseResponse<{
  badge: IAdminBadgeDefinition;
}>;
