import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ShiftParams } from './models/lifecycle';

const url = '/api/v1/campaigns';

export const closeAttendance = ({
  campaign_id,
  shift_id,
}: ShiftParams): Promise<IBaseResponse<{ checked_out: number }>> =>
  requestApi.post<IBaseResponse<{ checked_out: number }>>(
    `${url}/${campaign_id}/shifts/${shift_id}/attendance/close`,
    {},
  );

export const useCloseAttendance = (
  options?: UsePostOptions<IBaseResponse<{ checked_out: number }>, ShiftParams>,
) =>
  usePost({
    mutationFn: closeAttendance,
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
