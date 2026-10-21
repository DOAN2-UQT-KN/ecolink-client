import type { IBaseResponse } from '@/types/BaseResponse';
import type { IPageMeta, StockAdjustReason } from '@/apis/gift-source/models/giftSource';

export type StockBatchState = 'IN_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
export type StockMovementType = 'STOCK_IN' | 'REDEEM_OUT' | 'CANCEL_RETURN' | 'ADJUST_OUT' | 'EXPIRED';

export interface IStockBatch {
  id: string;
  giftId: string;
  source?: { id: string; name: string; type: string; status: string };
  quantity: number;
  remaining: number;
  unitValueVnd: number;
  receivedAt: string;
  expiresAt: string | null;
  reference: string;
  attachmentUrls: string[];
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  state: StockBatchState;
}

export interface IStockMovement {
  id: string;
  giftId: string;
  batchId: string;
  sourceName?: string;
  type: StockMovementType;
  quantity: number;
  reason: StockAdjustReason | null;
  note: string | null;
  redemptionId: string | null;
  /** null means the system (expiry job, migration). */
  actor?: { id: string; name: string } | null;
  createdAt: string;
}

export interface IGetStockBatchesRequest {
  giftId: string;
  page?: number;
  limit?: number;
  sourceId?: string;
}

export type IGetStockBatchesResponse = IBaseResponse<{ batches: IStockBatch[] } & IPageMeta>;

export interface ICreateStockBatchRequest {
  sourceId: string;
  quantity: number;
  unitValueVnd: number;
  /** ISO date-time */
  receivedAt: string;
  expiresAt?: string | null;
  /** May be empty when attachmentUrls has at least one file. */
  reference: string;
  attachmentUrls?: string[];
  note?: string | null;
}

export type ICreateStockBatchResponse = IBaseResponse<{ batch: IStockBatch; stockRemaining: number }>;

export interface IAdjustStockBatchRequest {
  quantity: number;
  reason: StockAdjustReason;
  note?: string | null;
}

export type IAdjustStockBatchResponse = IBaseResponse<{
  batch: IStockBatch;
  movement: IStockMovement;
  stockRemaining: number;
}>;

export interface IGetStockMovementsRequest {
  giftId: string;
  page?: number;
  limit?: number;
  batchId?: string;
  type?: StockMovementType;
}

export type IGetStockMovementsResponse = IBaseResponse<{ movements: IStockMovement[] } & IPageMeta>;
