import type { IGetAdminGiftRedemptionDetailResponse } from '@/apis/gift/models/gift';
import { useGet, type UseGetOptions } from '@/hooks/reactQuery';
import requestApi from '@/utils/requestApi';

const url = '/api/v1/admin/gift-redemptions';

export const getAdminRedemption = async (
  code: string,
): Promise<IGetAdminGiftRedemptionDetailResponse> => {
  return await requestApi.get<IGetAdminGiftRedemptionDetailResponse>(`${url}/${encodeURIComponent(code)}`);
};

export const useGetAdminRedemption = (
  code: string,
  options?: Omit<UseGetOptions<IGetAdminGiftRedemptionDetailResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-redemptions', 'admin', 'detail', code],
    queryFn: () => getAdminRedemption(code),
    enabled: !!code,
    ...options,
  });
};
