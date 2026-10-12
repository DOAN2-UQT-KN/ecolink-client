import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { IShiftResultView, SaveShiftResultParams } from './models/shiftResult';

const url = '/api/v1/campaigns';

export const saveShiftResult = ({
  campaign_id,
  shift_id,
  ...body
}: SaveShiftResultParams): Promise<IBaseResponse<IShiftResultView>> =>
  requestApi.put<IBaseResponse<IShiftResultView>>(`${url}/${campaign_id}/shifts/${shift_id}/result`, body);

export const useSaveShiftResult = (
  options?: UsePostOptions<IBaseResponse<IShiftResultView>, SaveShiftResultParams>,
) =>
  usePost({
    mutationFn: saveShiftResult,
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
