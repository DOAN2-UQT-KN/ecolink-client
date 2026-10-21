import type { IBaseResponse } from '@/types/BaseResponse';

export interface IGift {
  id: string;
  /** The server sends null here; read the name via `useLocalizedDisplay().title(gift)`. */
  name: string | null;
  nameVi?: string | null;
  nameEn?: string | null;
  mediaId: string | null;
  /** The server sends null here; read it via `useLocalizedDisplay().description(gift)`. */
  description: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  greenPoints: number;
  /** Items left in live stock batches; never null since spec 015. */
  stockRemaining: number;
  isActive: boolean;
  media: {
    id: string;
    url: string;
  } | null;
  /** Sources shown as "Sponsored by". */
  sponsors?: IGiftSponsor[];
  /** Admin only: items in batches expiring within 7 days. */
  expiringSoon?: { quantity: number; earliestAt: string } | null;
}

export interface IGiftSponsor {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface IGetGiftsRequest {
  page?: number;
  limit?: number;
  search?: string;
  /** When true, only gifts with stock remaining. */
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

export type IGetGiftResponse = IBaseResponse<{ gift: IGift }>;

export interface ICreateGiftRequest {
  name: string;
  // mediaId: string;
  imageUrl: string;
  description: string;
  greenPoints: number;
  isActive?: boolean;
}

export type ICreateGiftResponse = IBaseResponse<{ gift: IGift }>;

export interface IUpdateGiftRequest {
  name?: string;
  // mediaId?: string;
  imageUrl?: string;
  description?: string;
  greenPoints?: number;
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
  /** Stock batch the item came from; null for orders before spec 015. */
  batchId?: string | null;
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
  /** Source of the batch the item came from; null for older orders. */
  source: { id: string; name: string } | null;
}

export interface IGetGiftRedemptionsRequest {
  page?: number;
  limit?: number;
  status?: GiftRedemptionStatus;
  /** Admin list only: orders whose item came from this source. */
  sourceId?: string;
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
