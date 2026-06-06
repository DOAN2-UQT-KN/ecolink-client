import type {
  IGetGiftRedemptionsRequest,
  IGetGiftRedemptionsResponse,
} from '@/apis/gift/models/gift';
import { useGet, type UseGetOptions } from '@/hooks/reactQuery';
import requestApi from '@/utils/requestApi';

const url = '/api/v1/me/redemptions';

export const getGiftRedemptions = async (
  req: IGetGiftRedemptionsRequest,
): Promise<IGetGiftRedemptionsResponse> => {
  return await requestApi.get<IGetGiftRedemptionsResponse>(url, req);
};

export const useGetGiftRedemptions = (
  req: IGetGiftRedemptionsRequest,
  options?: Omit<UseGetOptions<IGetGiftRedemptionsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-redemptions', 'me', req],
    queryFn: () => getGiftRedemptions(req),
    ...options,
  });
};
