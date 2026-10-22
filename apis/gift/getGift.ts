import requestApi from '@/utils/requestApi';
import type { IGetGiftResponse } from '@/apis/gift/models/gift';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/gifts';

export const getGift = async (id: string): Promise<IGetGiftResponse> => {
  return await requestApi.get<IGetGiftResponse>(`${url}/${id}`);
};

/** Keyed under "gift-stock" so stock-in and write-off mutations refresh the stock figure too. */
export const useGetGift = (
  id: string,
  options?: Omit<UseGetOptions<IGetGiftResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-stock', 'gift', id],
    queryFn: () => getGift(id),
    enabled: Boolean(id),
    ...options,
  });
};
