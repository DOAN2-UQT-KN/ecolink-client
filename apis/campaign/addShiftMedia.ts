import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { AddShiftMediaParams, IShiftMedia } from './models/shiftResult';

const url = '/api/v1/campaigns';

export const addShiftMedia = ({
  campaign_id,
  shift_id,
  ...body
}: AddShiftMediaParams): Promise<IBaseResponse<{ media: IShiftMedia }>> =>
  requestApi.post<IBaseResponse<{ media: IShiftMedia }>>(`${url}/${campaign_id}/shifts/${shift_id}/media`, body);

export const useAddShiftMedia = (
  options?: UsePostOptions<IBaseResponse<{ media: IShiftMedia }>, AddShiftMediaParams>,
) =>
  usePost({
    mutationFn: addShiftMedia,
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
