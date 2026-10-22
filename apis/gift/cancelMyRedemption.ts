import type {
  ICancelMyRedemptionRequest,
  IGetGiftRedemptionDetailResponse,
} from '@/apis/gift/models/gift';
import { usePost, type UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import requestApi from '@/utils/requestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/me/redemptions';

export const cancelMyRedemption = async ({
  code,
  ...body
}: ICancelMyRedemptionRequest): Promise<IGetGiftRedemptionDetailResponse> => {
  return await requestApi.post<IGetGiftRedemptionDetailResponse>(
    `${url}/${encodeURIComponent(code)}/cancel`,
    body,
  );
};

export const useCancelMyRedemption = (
  options?: UsePostOptions<IGetGiftRedemptionDetailResponse, ICancelMyRedemptionRequest>,
) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return usePost({
    mutationFn: cancelMyRedemption,
    queryKey: ['gift-redemptions'],
    messageSuccess: {
      content: t('Order cancelled. Your points have been returned.'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
    onSuccess: (...args) => {
      // The refund changes the wallet; the restock changes the gift's stock.
      void queryClient.invalidateQueries({ queryKey: ['points'] });
      void queryClient.invalidateQueries({ queryKey: ['gifts'] });
      options?.onSuccess?.(...args);
    },
  });
};
