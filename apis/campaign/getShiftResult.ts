import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { ShiftParams } from './models/lifecycle';
import type { IShiftResultView } from './models/shiftResult';

const url = '/api/v1/campaigns';

export const getShiftResult = ({ campaign_id, shift_id }: ShiftParams): Promise<IBaseResponse<IShiftResultView>> =>
  requestApi.get<IBaseResponse<IShiftResultView>>(`${url}/${campaign_id}/shifts/${shift_id}/result`);

export const useShiftResult = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftResultView>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-result', params.shift_id],
    queryFn: () => getShiftResult(params),
    ...options,
  });
