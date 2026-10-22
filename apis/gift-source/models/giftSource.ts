import type { IBaseResponse } from '@/types/BaseResponse';
import type { IStockBatch } from '@/apis/gift-stock/models/stock';

export type GiftSourceType = 'SPONSOR' | 'ECOLINK' | 'DONATION';
export type GiftSourceStatus = 'ACTIVE' | 'INACTIVE';
export type StockAdjustReason = 'DAMAGED' | 'LOST' | 'COUNT_SHORTAGE' | 'RETURN_TO_SOURCE';

export interface IGiftSource {
  id: string;
  name: string;
  type: GiftSourceType;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  logo: { id: string; url: string } | null;
  showOnGift: boolean;
  status: GiftSourceStatus;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  batchCount: number;
}

export interface IPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IGetGiftSourcesRequest {
  page?: number;
  limit?: number;
  type?: GiftSourceType;
  status?: GiftSourceStatus;
  search?: string;
}

export type IGetGiftSourcesResponse = IBaseResponse<{ sources: IGiftSource[] } & IPageMeta>;

export type IGiftSourceResponse = IBaseResponse<{ source: IGiftSource }>;

export interface IGiftSourceBody {
  name?: string;
  type?: GiftSourceType;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  /** Uploaded logo URL; "" removes the logo. */
  logoUrl?: string;
  showOnGift?: boolean;
  status?: GiftSourceStatus;
  note?: string | null;
}

export interface IGetGiftSourceBatchesRequest {
  id: string;
  page?: number;
  limit?: number;
}

export type IGetGiftSourceBatchesResponse = IBaseResponse<
  { batches: Array<IStockBatch & { gift: { id: string; name: string } }> } & IPageMeta
>;

export interface IGetGiftSourceReportRequest {
  id: string;
  /** YYYY-MM-DD (UTC+7) */
  from?: string;
  /** YYYY-MM-DD (UTC+7), inclusive */
  to?: string;
}

export interface IGiftSourceReportRow {
  received: number;
  delivered: number;
  holding: number;
  shrinkage: Record<StockAdjustReason, number>;
  expired: number;
  inStock: number;
  valueDeliveredVnd: number;
  recipients: number;
}

export type IGetGiftSourceReportResponse = IBaseResponse<{
  report: {
    sourceId: string;
    from: string;
    to: string;
    totals: IGiftSourceReportRow;
    gifts: Array<IGiftSourceReportRow & { giftId: string; giftName: string }>;
  };
}>;
