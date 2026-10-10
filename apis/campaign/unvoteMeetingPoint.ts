import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { MeetingPointDecisionResponse, UnvoteMeetingPointParams } from './models/verification';

const url = '/api/v1/campaigns';

/** Take one's vote back while the window is open. */
export const unvoteMeetingPoint = ({
  campaign_id,
  meeting_point_id,
}: UnvoteMeetingPointParams): Promise<MeetingPointDecisionResponse> =>
  requestApi.delete<MeetingPointDecisionResponse>(`${url}/${campaign_id}/verification/${meeting_point_id}/vote`);

export const useUnvoteMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, UnvoteMeetingPointParams>,
) =>
  usePost({
    mutationFn: unvoteMeetingPoint,
    queryKey: ['campaign-verification'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
