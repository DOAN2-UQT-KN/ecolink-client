import type { IBaseResponse } from '@/types/BaseResponse';

export interface IGift {
  id: string;
  name: string;
  mediaId: string | null;
  description: string;
  greenPoints: number;
  stockRemaining: number | null;
  isActive: boolean;
  media: {
    id: string;
    url: string;
  } | null;
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
  meta?: IGiftListMeta;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
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
  giftId: string;
  greenPointsSpent: number;
  phoneNumber: string;
  pickupLocation: string;
  status: GiftRedemptionStatus;
  statusUpdatedAt: string;
  cancelledAt: string | null;
  createdAt: string;
}

export type GiftRedemptionStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface IRedeemGiftRequest {
  id: string;
  phoneNumber: string;
  pickupLocation: string;
}

export type IRedeemGiftResponse = IBaseResponse<{
  redemption: IGiftRedeem;
}>;

export interface IGiftRedemptionGiftSnapshot {
  id: string;
  name: string;
  nameVi?: string | null;
  nameEn?: string | null;
  description: string;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  mediaId: string | null;
  greenPoints: number;
}

export interface IGiftRedemptionUserSnapshot {
  id: string;
  name: string;
  avatar: string | null;
}

export interface IGiftRedemptionListItem extends IGiftRedeem {
  userId?: string;
  gift: IGiftRedemptionGiftSnapshot | null;
}

export interface IAdminGiftRedemptionListItem extends IGiftRedemptionListItem {
  userId: string;
  user: IGiftRedemptionUserSnapshot | null;
}

export interface IGetGiftRedemptionsRequest {
  page?: number;
  limit?: number;
  status?: GiftRedemptionStatus;
  sortBy?: 'createdAt' | 'greenPointsSpent' | 'statusUpdatedAt';
  sortOrder?: 'asc' | 'desc';
}

export type IGetGiftRedemptionsResponse = IBaseResponse<{
  redemptions: IGiftRedemptionListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type IGetAdminGiftRedemptionsResponse = IBaseResponse<{
  redemptions: IAdminGiftRedemptionListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export interface IUpdateGiftRedemptionStatusRequest {
  id: string;
  status: GiftRedemptionStatus;
}
