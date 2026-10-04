import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { IGetCampaignByIdResponse } from './models/campaignById';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { IBaseResponse } from '@/types/BaseResponse';

const url = '/api/v1/campaigns';

export const getCampaignById = async (id: string): Promise<IGetCampaignByIdResponse> => {
  return await requestApi.get<IGetCampaignByIdResponse>(`${url}/${id}`);
};

export const useGetCampaignById = (
  id: string,
  options?: Omit<UseGetOptions<IGetCampaignByIdResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign', id],
    queryFn: () => getCampaignById(id),
    ...options,
  });
};

export type MarkDoneCampaignParams = {
  id: string;
  /** One entry per trash report no shift handled, with the reason (spec 5.1). */
  unhandled?: { report_id: string; reason: string }[];
};

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
