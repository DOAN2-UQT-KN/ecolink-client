import requestApi from '@/utils/requestApi';
import type { IAdjustStockBatchRequest, IAdjustStockBatchResponse } from '@/apis/gift-stock/models/stock';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const url = '/api/v1/admin/stock-batches';

export const adjustStockBatch = async ({
  batchId,
  data,
}: {
  batchId: string;
  data: IAdjustStockBatchRequest;
}): Promise<IAdjustStockBatchResponse> => {
  return await requestApi.post<IAdjustStockBatchResponse>(`${url}/${batchId}/adjustments`, data);
};

export const useAdjustStockBatch = (
  options?: UsePostOptions<IAdjustStockBatchResponse, { batchId: string; data: IAdjustStockBatchRequest }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: adjustStockBatch,
    queryKey: ['gift-stock'],
    messageSuccess: { content: t('Stock written off'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
