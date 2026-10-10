import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { IShiftOverview } from './models/shiftResult';

const url = '/api/v1/campaigns';

export const getShiftOverview = (campaignId: string): Promise<IBaseResponse<IShiftOverview>> =>
  requestApi.get<IBaseResponse<IShiftOverview>>(`${url}/${campaignId}/shift-overview`);

/** Every shift's status and figures, with the campaign totals (managers and admins). */
export const useShiftOverview = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftOverview>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-overview', campaignId],
    queryFn: () => getShiftOverview(campaignId),
    ...options,
  });
