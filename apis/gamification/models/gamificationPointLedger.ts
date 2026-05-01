import type { IBaseResponse } from "@/types/BaseResponse";

export interface IGamificationPointTransaction {
  id: string;
  kind: string;
  amount: number;
  sourceType: string;
  sourceId: string | null;
  seasonId: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface IGetGamificationPointTransactionsRequest {
  page?: number;
  limit?: number;
  kind?: "CRP" | "VRP" | "SP";
}

export type IGetGamificationPointTransactionsResponse = IBaseResponse<{
  transactions: IGamificationPointTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;
