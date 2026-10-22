import type { IGetGiftRedemptionDetailResponse } from '@/apis/gift/models/gift';
import { useGet, type UseGetOptions } from '@/hooks/reactQuery';
import requestApi from '@/utils/requestApi';

const url = '/api/v1/me/redemptions';

export const getMyRedemption = async (code: string): Promise<IGetGiftRedemptionDetailResponse> => {
  return await requestApi.get<IGetGiftRedemptionDetailResponse>(`${url}/${encodeURIComponent(code)}`);
};

export const useGetMyRedemption = (
  code: string,
  options?: Omit<UseGetOptions<IGetGiftRedemptionDetailResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-redemptions', 'me', 'detail', code],
    queryFn: () => getMyRedemption(code),
    enabled: !!code,
    ...options,
  });
};
