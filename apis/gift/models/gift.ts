import type { IBaseResponse } from '@/types/BaseResponse';

export interface IGift {
  id: string;
  name: string;
  mediaId: string;
  description: string;
  greenPoints: number;
  stockRemaining: number | null;
  isActive: boolean;
}

export interface IGetGiftsRequest {
  page?: number;
  limit?: number;
  search?: string;
  /** When true, only gifts with stock remaining or unlimited stock. */
  inStock?: boolean;
  /** Admin-only filter (ignored for non-admin callers). */
  isActive?: boolean;
  greenPointsMin?: number;
  greenPointsMax?: number;
}

export interface IGiftListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type IGetGiftsResponse = IBaseResponse<{
  gifts: IGift[];
  meta: IGiftListMeta;
}>;

export interface ICreateGiftRequest {
  name: string;
  // mediaId: string;
  imageUrl: string;
  description: string;
  greenPoints: number;
  stockRemaining?: number | null;
  isActive?: boolean;
}

export type ICreateGiftResponse = IBaseResponse<{ gift: IGift }>;

export interface IUpdateGiftRequest {
  name?: string;
  // mediaId?: string;
  imageUrl?: string;
  description?: string;
  greenPoints?: number;
  stockRemaining?: number | null;
  isActive?: boolean;
}

export type IUpdateGiftResponse = IBaseResponse<{ gift: IGift }>;

export interface IGiftRedeem {
  id: string;
  name: string;
  giftId: string;
  greenPointsSpent: string;
  createdAt: string;
}

export interface IRedeemGiftRequest {
  id: string;
}

export type IRedeemGiftResponse = IBaseResponse<{
  redemption: IGiftRedeem;
}>;
