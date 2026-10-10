import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import type { MarkDoneCampaignParams } from './models/campaignById';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { IBaseResponse } from '@/types/BaseResponse';

const url = '/api/v1/campaigns';

export const markDoneCampaign = async ({ id, unhandled }: MarkDoneCampaignParams): Promise<IBaseResponse<null>> => {
  return await requestApi.put<IBaseResponse<null>>(`${url}/${id}/mark-done`, { unhandled: unhandled ?? [] });
};

export const useMarkDoneCampaign = (
  options?: UsePostOptions<IBaseResponse<null>, MarkDoneCampaignParams>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: markDoneCampaign,
    queryKey: ['campaign'],
    messageSuccess: {
      content: t('Campaign marked as done successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
