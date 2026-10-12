import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { DecideMeetingPointParams, MeetingPointDecisionResponse } from './models/verification';

const url = '/api/v1/campaigns';

/** Admin: settles a flagged meeting point. */
export const decideMeetingPoint = ({
  campaign_id,
  meeting_point_id,
  ...body
}: DecideMeetingPointParams): Promise<MeetingPointDecisionResponse> =>
  requestApi.put<MeetingPointDecisionResponse>(
    `${url}/${campaign_id}/verification/${meeting_point_id}/decision`,
    body,
  );

export const useDecideMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, DecideMeetingPointParams>,
) =>
  usePost({
    mutationFn: decideMeetingPoint,
    queryKey: ['completion-review'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
