import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/campaigns';

export const verifyCampaign = async (id: string): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/verify`, {});
};

export const useVerifyCampaign = (options?: UsePostOptions<IBaseResponse<unknown>, string>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: verifyCampaign,
    messageSuccess: {
      content: t('Campaign verified successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const rejectCampaign = async (id: string): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/reject`, {});
};

export const useRejectCampaign = (options?: UsePostOptions<IBaseResponse<unknown>, string>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: rejectCampaign,
    messageSuccess: {
      content: t('Campaign rejected successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
