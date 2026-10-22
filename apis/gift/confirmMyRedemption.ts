import type {
  IConfirmMyRedemptionRequest,
  IGetGiftRedemptionDetailResponse,
} from '@/apis/gift/models/gift';
import { usePost, type UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import requestApi from '@/utils/requestApi';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/me/redemptions';

export const confirmMyRedemption = async ({
  code,
}: IConfirmMyRedemptionRequest): Promise<IGetGiftRedemptionDetailResponse> => {
  return await requestApi.post<IGetGiftRedemptionDetailResponse>(
    `${url}/${encodeURIComponent(code)}/confirm-delivery`,
    {},
  );
};

export const useConfirmMyRedemption = (
  options?: UsePostOptions<IGetGiftRedemptionDetailResponse, IConfirmMyRedemptionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: confirmMyRedemption,
    queryKey: ['gift-redemptions'],
    messageSuccess: {
      content: t('Thanks! The order is marked as delivered.'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
