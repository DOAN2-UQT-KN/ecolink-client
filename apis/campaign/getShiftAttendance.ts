import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { ShiftParams } from './models/lifecycle';
import type { IShiftAttendanceView } from './models/attendance';

const url = '/api/v1/campaigns';

export const getShiftAttendance = ({
  campaign_id,
  shift_id,
}: ShiftParams): Promise<IBaseResponse<IShiftAttendanceView>> =>
  requestApi.get<IBaseResponse<IShiftAttendanceView>>(`${url}/${campaign_id}/shifts/${shift_id}/attendance`);

export const useShiftAttendance = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftAttendanceView>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-attendance', params.shift_id],
    queryFn: () => getShiftAttendance(params),
    ...options,
  });
