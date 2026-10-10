import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { MeetingPointDecisionResponse, VoteMeetingPointParams } from './models/verification';

const url = '/api/v1/campaigns';

export const voteMeetingPoint = ({
  campaign_id,
  meeting_point_id,
  ...body
}: VoteMeetingPointParams): Promise<MeetingPointDecisionResponse> =>
  requestApi.put<MeetingPointDecisionResponse>(
    `${url}/${campaign_id}/verification/${meeting_point_id}/vote`,
    body,
  );

export const useVoteMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, VoteMeetingPointParams>,
) =>
  usePost({
    mutationFn: voteMeetingPoint,
    queryKey: ['campaign-verification'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
