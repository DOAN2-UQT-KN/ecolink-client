import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { AddManualAttendanceParams } from './models/attendance';

const url = '/api/v1/campaigns';

export const addManualAttendance = ({
  campaign_id,
  shift_id,
  ...body
}: AddManualAttendanceParams): Promise<IBaseResponse<unknown>> =>
  requestApi.post<IBaseResponse<unknown>>(`${url}/${campaign_id}/shifts/${shift_id}/attendance/manual`, body);

export const useAddManualAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, AddManualAttendanceParams>,
) =>
  usePost({
    mutationFn: addManualAttendance,
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
