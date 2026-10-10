import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ICloseShiftResponse } from './models/registration';

const url = '/api/v1/campaigns';

export const closeShift = async ({
  campaign_id,
  shift_id,
}: {
  campaign_id: string;
  shift_id: string;
}): Promise<ICloseShiftResponse> =>
  requestApi.post<ICloseShiftResponse>(`${url}/${campaign_id}/shifts/${shift_id}/close`, {});

/** Managers: turn a shift off before it starts; its volunteers are told to pick another. */
export const useCloseShift = (
  options?: UsePostOptions<ICloseShiftResponse, { campaign_id: string; shift_id: string }>,
) =>
  usePost({
    mutationFn: closeShift,
    queryKey: ['campaign-registrations'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
