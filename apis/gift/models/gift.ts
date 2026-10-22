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
  /** Public order code, e.g. "EL-7F3K2QXM". */
  code: string;
  giftId: string;
  /** Total points paid = unitPoints × quantity. */
  greenPointsSpent: number;
  /** Items of the gift in this order (1..10); 1 for orders before spec 018. */
  quantity: number;
  /** Listed price of one item when ordered. */
  unitPoints: number;
  phoneNumber: string;
  pickupLocation: string;
  /** Delivery details; null on orders made before they were asked for. */
  recipientName?: string | null;
  addressDetail?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryNote?: string | null;
  status: GiftRedemptionStatus;
  statusUpdatedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  cancelReason?: string | null;
  /** Carrier and its tracking code, set when the order ships. */
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  /** Statuses the caller may move this order to (owner's actions on /me, admin's on /admin). */
  allowedTransitions: GiftRedemptionStatus[];
}

export type GiftRedemptionStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface IRedeemGiftRequest {
  id: string;
  /** 1..10; the server takes 1 when it is left out. */
  quantity?: number;
  /** Vietnamese mobile, digits only. */
  phoneNumber: string;
  recipientName: string;
  /** Address picked on the Goong map. */
  pickupLocation: string;
  /** House number, building, floor, room. */
  addressDetail?: string | null;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryNote?: string | null;
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
  /** Gift image; null when the gift has none. */
  mediaUrl?: string | null;
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

export interface IGiftRedemptionSource {
  id: string;
  name: string;
  quantity: number;
}

export interface IAdminGiftRedemptionListItem extends IGiftRedemptionListItem {
  userId: string;
  user: IGiftRedemptionUserSnapshot | null;
  /** Sources the items came from, with how many from each; empty for orders before spec 015. */
  sources: IGiftRedemptionSource[];
  /** Whether the item went back to stock on cancel; null unless cancelled. */
  restocked: boolean | null;
}

export type GiftRedemptionEventType =
  | 'CREATED'
  | 'SHIPPED'
  | 'TRACKING_UPDATED'
  | 'DELIVERED'
  | 'CANCELLED';

/** One line of the order history; `actor` only comes back to admins. */
export interface IGiftRedemptionEvent {
  id: string;
  type: GiftRedemptionEventType;
  fromStatus: GiftRedemptionStatus | null;
  toStatus: GiftRedemptionStatus | null;
  actorRole: 'USER' | 'ADMIN';
  actor?: { id: string; name: string | null } | null;
  data: {
    carrier?: string;
    trackingCode?: string;
    previousCarrier?: string | null;
    previousTrackingCode?: string | null;
    cancelReason?: string | null;
    restocked?: boolean | null;
    /** CREATED: items ordered (spec 018); absent on older orders, which hold one. */
    quantity?: number;
    /** CANCELLED: items that went back to stock. */
    returnedQuantity?: number;
  } | null;
  /** Rebuilt from timestamps for orders made before history was kept. */
  reconstructed: boolean;
  createdAt: string;
}

export interface IGiftRedemptionDetail extends IGiftRedemptionListItem {
  /** Newest first. */
  events: IGiftRedemptionEvent[];
}

export interface IAdminGiftRedemptionDetail extends IAdminGiftRedemptionListItem {
  events: IGiftRedemptionEvent[];
}

export type IGetGiftRedemptionDetailResponse = IBaseResponse<{ redemption: IGiftRedemptionDetail }>;

export type IGetAdminGiftRedemptionDetailResponse = IBaseResponse<{
  redemption: IAdminGiftRedemptionDetail;
}>;

export interface IGetGiftRedemptionsRequest {
  page?: number;
  limit?: number;
  status?: GiftRedemptionStatus;
  /** Admin list only: orders whose item came from this source. */
  sourceId?: string;
  /** Order code, any case, with or without "EL-". */
  code?: string;
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
  /** Required (1–500 chars) when cancelling. */
  cancelReason?: string;
  /** Required when cancelling a SHIPPED order. */
  restock?: boolean;
  /** Required when shipping. */
  carrier?: string;
  trackingCode?: string;
}

export interface IUpdateRedemptionTrackingRequest {
  id: string;
  carrier: string;
  trackingCode: string;
}

export interface ICancelMyRedemptionRequest {
  code: string;
  cancelReason: string;
}

export interface IConfirmMyRedemptionRequest {
  code: string;
}
