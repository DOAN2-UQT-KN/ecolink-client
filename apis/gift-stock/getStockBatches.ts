import requestApi from '@/utils/requestApi';
import type { IGetStockBatchesRequest, IGetStockBatchesResponse } from '@/apis/gift-stock/models/stock';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gifts';

export const getStockBatches = async ({
  giftId,
  ...params
}: IGetStockBatchesRequest): Promise<IGetStockBatchesResponse> => {
  return await requestApi.get<IGetStockBatchesResponse>(`${url}/${giftId}/stock-batches`, params);
};

export const useGetStockBatches = (
  req: IGetStockBatchesRequest,
  options?: Omit<UseGetOptions<IGetStockBatchesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-stock', 'batches', req],
    queryFn: () => getStockBatches(req),
    enabled: Boolean(req.giftId),
    ...options,
  });
};
