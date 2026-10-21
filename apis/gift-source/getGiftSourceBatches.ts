import requestApi from '@/utils/requestApi';
import type {
  IGetGiftSourceBatchesRequest,
  IGetGiftSourceBatchesResponse,
} from '@/apis/gift-source/models/giftSource';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gift-sources';

export const getGiftSourceBatches = async ({
  id,
  ...params
}: IGetGiftSourceBatchesRequest): Promise<IGetGiftSourceBatchesResponse> => {
  return await requestApi.get<IGetGiftSourceBatchesResponse>(`${url}/${id}/batches`, params);
};

export const useGetGiftSourceBatches = (
  req: IGetGiftSourceBatchesRequest,
  options?: Omit<UseGetOptions<IGetGiftSourceBatchesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-sources', 'batches', req],
    queryFn: () => getGiftSourceBatches(req),
    enabled: Boolean(req.id),
    ...options,
  });
};
