import type {
  IRedeemGiftResponse,
  IUpdateRedemptionTrackingRequest,
} from '@/apis/gift/models/gift';
import { usePost, type UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import requestApi from '@/utils/requestApi';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/admin/gift-redemptions';

export const updateRedemptionTracking = async ({
  id,
  ...body
}: IUpdateRedemptionTrackingRequest): Promise<IRedeemGiftResponse> => {
  return await requestApi.patch<IRedeemGiftResponse>(`${url}/${id}/tracking`, body);
};

export const useUpdateRedemptionTracking = (
  options?: UsePostOptions<IRedeemGiftResponse, IUpdateRedemptionTrackingRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateRedemptionTracking,
    queryKey: ['gift-redemptions'],
    messageSuccess: { content: t('Tracking updated'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
