import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ExcludeAttendanceParams } from './models/attendance';

const url = '/api/v1/campaigns';

/** Take an attendance out of the points (e.g. a flagged scan), with a reason. */
export const excludeAttendance = ({
  campaign_id,
  shift_id,
  user_id,
  reason,
}: ExcludeAttendanceParams): Promise<IBaseResponse<unknown>> =>
  requestApi.post<IBaseResponse<unknown>>(
    `${url}/${campaign_id}/shifts/${shift_id}/attendance/${user_id}/exclude`,
    { reason },
  );

export const useExcludeAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, ExcludeAttendanceParams>,
) =>
  usePost({
    mutationFn: excludeAttendance,
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
