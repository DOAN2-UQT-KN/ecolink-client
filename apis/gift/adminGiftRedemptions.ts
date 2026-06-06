import type {
  IGetAdminGiftRedemptionsResponse,
  IGetGiftRedemptionsRequest,
  IRedeemGiftResponse,
  IUpdateGiftRedemptionStatusRequest,
} from '@/apis/gift/models/gift';
import { useGet, type UseGetOptions, usePost, type UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import requestApi from '@/utils/requestApi';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/admin/gift-redemptions';

export const getAdminGiftRedemptions = async (
  req: IGetGiftRedemptionsRequest,
): Promise<IGetAdminGiftRedemptionsResponse> => {
  return await requestApi.get<IGetAdminGiftRedemptionsResponse>(url, req);
};

export const useGetAdminGiftRedemptions = (
  req: IGetGiftRedemptionsRequest,
  options?: Omit<UseGetOptions<IGetAdminGiftRedemptionsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-redemptions', 'admin', req],
    queryFn: () => getAdminGiftRedemptions(req),
    ...options,
  });
};

export const updateGiftRedemptionStatus = async ({
  id,
  status,
}: IUpdateGiftRedemptionStatusRequest): Promise<IRedeemGiftResponse> => {
  return await requestApi.patch<IRedeemGiftResponse>(`${url}/${id}/status`, { status });
};

export const useUpdateGiftRedemptionStatus = (
  options?: UsePostOptions<IRedeemGiftResponse, IUpdateGiftRedemptionStatusRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateGiftRedemptionStatus,
    queryKey: ['gift-redemptions'],
    messageSuccess: {
      content: t('Redemption status updated'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
