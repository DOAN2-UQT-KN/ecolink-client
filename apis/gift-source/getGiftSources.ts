import requestApi from '@/utils/requestApi';
import type { IGetGiftSourcesRequest, IGetGiftSourcesResponse } from '@/apis/gift-source/models/giftSource';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gift-sources';

export const getGiftSources = async (req: IGetGiftSourcesRequest): Promise<IGetGiftSourcesResponse> => {
  return await requestApi.get<IGetGiftSourcesResponse>(url, req);
};

export const useGetGiftSources = (
  req: IGetGiftSourcesRequest,
  options?: Omit<UseGetOptions<IGetGiftSourcesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-sources', req],
    queryFn: () => getGiftSources(req),
    ...options,
  });
};
