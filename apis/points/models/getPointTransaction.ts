import { IPaginationResponse } from '@/types/PaginationResponse';
import { IPointTransaction } from './point';

export interface IGetPointTransactionRequest {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
  type?: 'earned' | 'spent';
}

export interface IGetPointTransactionResponse extends IPaginationResponse<
  IPointTransaction[],
  'transactions'
> {}
