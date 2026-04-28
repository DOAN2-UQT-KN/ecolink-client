import requestApi from '@/utils/requestApi';
import type { IGetPointRequest, IGetPointResponse } from '@/apis/points/models/getPoint';
import type {
  IGetPointTransactionRequest,
  IGetPointTransactionResponse,
} from '@/apis/points/models/getPointTransaction';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/me/points';

export const getPoints = async (req: IGetPointRequest): Promise<IGetPointResponse> => {
  return await requestApi.get<IGetPointResponse>(url, req);
};

export const useGetPoints = (
  req: IGetPointRequest,
  options?: Omit<UseGetOptions<IGetPointResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['points', req],
    queryFn: () => getPoints(req),
    ...options,
  });
};

export const getPointTransactions = async (
  req: IGetPointTransactionRequest,
): Promise<IGetPointTransactionResponse> => {
  return await requestApi.get<IGetPointTransactionResponse>(`${url}/transactions`, req);
};

export const useGetPointTransactions = (
  req: IGetPointTransactionRequest,
  options?: Omit<UseGetOptions<IGetPointTransactionResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['point-transactions', req],
    queryFn: () => getPointTransactions(req),
    ...options,
  });
};
