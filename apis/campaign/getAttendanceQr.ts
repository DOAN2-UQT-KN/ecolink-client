import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { ShiftParams } from './models/lifecycle';
import type { IAttendanceQr } from './models/attendance';

const url = '/api/v1/campaigns';

export const getAttendanceQr = ({ campaign_id, shift_id }: ShiftParams): Promise<IBaseResponse<IAttendanceQr>> =>
  requestApi.get<IBaseResponse<IAttendanceQr>>(`${url}/${campaign_id}/shifts/${shift_id}/attendance/qr`);

/** The open session's current code; refetch every `period_sec`. */
export const useAttendanceQr = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IAttendanceQr>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-attendance-qr', params.shift_id],
    queryFn: () => getAttendanceQr(params),
    ...options,
  });
