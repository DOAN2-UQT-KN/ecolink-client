import requestApi from '@/utils/requestApi';
import type { ICreateStockBatchRequest, ICreateStockBatchResponse } from '@/apis/gift-stock/models/stock';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const url = '/api/v1/admin/gifts';

export const createStockBatch = async ({
  giftId,
  data,
}: {
  giftId: string;
  data: ICreateStockBatchRequest;
}): Promise<ICreateStockBatchResponse> => {
  return await requestApi.post<ICreateStockBatchResponse>(`${url}/${giftId}/stock-batches`, data);
};

export const useCreateStockBatch = (
  options?: UsePostOptions<ICreateStockBatchResponse, { giftId: string; data: ICreateStockBatchRequest }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createStockBatch,
    queryKey: ['gift-stock'],
    messageSuccess: { content: t('Stock received'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
