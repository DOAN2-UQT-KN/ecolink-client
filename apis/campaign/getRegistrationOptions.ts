import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { IGetRegistrationOptionsResponse } from './models/registration';

const url = '/api/v1/campaigns';

export const getRegistrationOptions = async (
  campaignId: string,
): Promise<IGetRegistrationOptionsResponse> =>
  requestApi.get<IGetRegistrationOptionsResponse>(`${url}/${campaignId}/registration-options`);

/** Shifts the viewer can pick, with counts and overlaps. */
export const useGetRegistrationOptions = (
  campaignId: string,
  options?: Omit<UseGetOptions<IGetRegistrationOptionsResponse>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['campaign-registration-options', campaignId],
    queryFn: () => getRegistrationOptions(campaignId),
    ...options,
  });
