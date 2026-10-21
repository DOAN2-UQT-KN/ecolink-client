import requestApi from '@/utils/requestApi';
import type { IGetStockMovementsRequest, IGetStockMovementsResponse } from '@/apis/gift-stock/models/stock';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gifts';

export const getStockMovements = async ({
  giftId,
  ...params
}: IGetStockMovementsRequest): Promise<IGetStockMovementsResponse> => {
  return await requestApi.get<IGetStockMovementsResponse>(`${url}/${giftId}/stock-movements`, params);
};

export const useGetStockMovements = (
  req: IGetStockMovementsRequest,
  options?: Omit<UseGetOptions<IGetStockMovementsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-stock', 'movements', req],
    queryFn: () => getStockMovements(req),
    enabled: Boolean(req.giftId),
    ...options,
  });
};
