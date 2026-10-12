import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ShiftParams } from './models/lifecycle';
import type { IAttendanceSession } from './models/attendance';

const url = '/api/v1/campaigns';

export const openAttendanceSession = ({
  campaign_id,
  shift_id,
}: ShiftParams): Promise<IBaseResponse<{ session: IAttendanceSession }>> =>
  requestApi.post<IBaseResponse<{ session: IAttendanceSession }>>(
    `${url}/${campaign_id}/shifts/${shift_id}/attendance/session`,
    {},
  );

export const useOpenAttendanceSession = (
  options?: UsePostOptions<IBaseResponse<{ session: IAttendanceSession }>, ShiftParams>,
) =>
  usePost({
    mutationFn: openAttendanceSession,
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
