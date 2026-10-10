import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ShiftParams } from './models/lifecycle';

const url = '/api/v1/campaigns';

/** Put an excluded attendance back into the points. */
export const restoreAttendance = ({
  campaign_id,
  shift_id,
  user_id,
}: ShiftParams & { user_id: string }): Promise<IBaseResponse<unknown>> =>
  requestApi.post<IBaseResponse<unknown>>(`${url}/${campaign_id}/shifts/${shift_id}/attendance/${user_id}/restore`, {});

export const useRestoreAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, ShiftParams & { user_id: string }>,
) =>
  usePost({
    mutationFn: restoreAttendance,
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
