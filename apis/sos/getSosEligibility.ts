import requestApi from '@/utils/requestApi';
import type {
  IGetSosEligibilityResponse,
  ISosEligibilityRequest,
} from '@/apis/sos/models/sos';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { SOS_URL } from '@/apis/sos/adapters';

const url = `${SOS_URL}/eligibility`;

export const getSosEligibility = async (
  params: ISosEligibilityRequest,
): Promise<IGetSosEligibilityResponse> => {
  return await requestApi.get<IGetSosEligibilityResponse>(url, params);
};

export const useSosEligibility = (
  params: ISosEligibilityRequest,
  options?: Omit<UseGetOptions<IGetSosEligibilityResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos-eligibility', params],
    queryFn: () => getSosEligibility(params),
    staleTime: 30_000,
    retry: false,
    ...options,
  });
};
