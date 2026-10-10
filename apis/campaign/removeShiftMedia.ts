import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ShiftParams } from './models/lifecycle';

const url = '/api/v1/campaigns';

export const removeShiftMedia = ({
  campaign_id,
  shift_id,
  media_id,
}: ShiftParams & { media_id: string }): Promise<IBaseResponse<unknown>> =>
  requestApi.delete<IBaseResponse<unknown>>(`${url}/${campaign_id}/shifts/${shift_id}/media/${media_id}`);

export const useRemoveShiftMedia = (
  options?: UsePostOptions<IBaseResponse<unknown>, ShiftParams & { media_id: string }>,
) =>
  usePost({
    mutationFn: removeShiftMedia,
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
