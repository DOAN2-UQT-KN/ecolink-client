import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ShiftParams } from './models/lifecycle';

const url = '/api/v1/campaigns';

/** Ends a running shift now; it needs a result first. */
export const endShiftEarly = ({
  campaign_id,
  shift_id,
}: ShiftParams): Promise<IBaseResponse<{ ended_at: string; checked_out: number }>> =>
  requestApi.post<IBaseResponse<{ ended_at: string; checked_out: number }>>(
    `${url}/${campaign_id}/shifts/${shift_id}/end`,
    {},
  );

export const useEndShiftEarly = (
  options?: UsePostOptions<IBaseResponse<{ ended_at: string; checked_out: number }>, ShiftParams>,
) =>
  usePost({
    mutationFn: endShiftEarly,
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
