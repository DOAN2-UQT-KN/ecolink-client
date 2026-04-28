import requestApi from '@/utils/requestApi';
import type { IRedeemGiftRequest, IRedeemGiftResponse } from '@/apis/gift/models/gift';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const baseurl = '/api/v1/gifts';

export const redeemGift = async ({ id }: { id: string }): Promise<IRedeemGiftResponse> => {
  return await requestApi.post<IRedeemGiftResponse>(`${baseurl}/${id}/redeem`, {});
};

export const useRedeemGift = (
  options?: UsePostOptions<IRedeemGiftResponse, IRedeemGiftRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: redeemGift,
    queryKey: ['gifts'],
    messageSuccess: {
      content: t('Gift redeemed successfully'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
