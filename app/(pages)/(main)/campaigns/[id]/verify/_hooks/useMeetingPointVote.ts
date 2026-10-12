import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnvoteMeetingPoint } from '@/apis/campaign/unvoteMeetingPoint';
import { useVoteMeetingPoint } from '@/apis/campaign/voteMeetingPoint';
import type {
  IMeetingPointView,
  IVerificationTrashPoint,
  MeetingPointVoteValue,
} from '@/apis/campaign/models/verification';
import { uploadToCloudinary } from '@/libs/cloudinary';
import { getCurrentPosition } from '@/libs/geo';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { buildVotePayload, downVoteError, initialFlagged } from '../_services/verification.service';
import { refreshCampaign } from '../../../_services/campaignCache.service';

/** The viewer's "clean" / "not clean" vote on one meeting point, and the "not clean" form. */
export function useMeetingPointVote(
  campaignId: string,
  point: IMeetingPointView,
  cleaned: IVerificationTrashPoint[],
) {
  const { t } = useTranslation('common');
  const [downOpen, setDownOpen] = useState(false);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<string[]>(() => initialFlagged(point, cleaned));
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState('');
  /** Which button's request is running: a vote side, the form's submit, or taking a vote back. */
  const [acting, setActing] = useState<MeetingPointVoteValue | 'submit' | null>(null);

  // Votes also refetch the campaign: the server may decide the campaign (status change) after a vote.
  const { mutate: unvoteMutate, isPending: unvoting } = useUnvoteMeetingPoint({
    onSuccess: () => {
      refreshCampaign(campaignId);
      cancelDown();
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Your vote was removed') });
    },
    onSettled: () => setActing(null),
  });

  const { mutate, isPending } = useVoteMeetingPoint({
    onSettled: () => setActing(null),
    onSuccess: () => {
      refreshCampaign(campaignId);
      setDownOpen(false);
      setFormError('');
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Your vote was saved') });
    },
  });

  /** Close the "not clean" form and drop what was typed in it. */
  const cancelDown = () => {
    setDownOpen(false);
    setNote('');
    setPhotoUrl(null);
    setFlagged(initialFlagged(point, cleaned));
    setFormError('');
  };

  const vote = async (value: MeetingPointVoteValue) => {
    if (value === 'down') {
      const error = downVoteError(flagged, note, photoUrl);
      if (error) {
        setFormError(t(error));
        return;
      }
    }
    setFormError('');
    setActing(value === 'down' ? 'submit' : 'up');
    setLocating(true);
    // No position (refused or unavailable): the vote then counts as online.
    const pos = await getCurrentPosition({ maximumAge: 0 });
    setLocating(false);
    mutate(buildVotePayload(campaignId, point.meeting_point_id, value, { flagged, note, photoUrl }, pos));
  };

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Warning, title: t('Use images only.') });
      return;
    }
    setUploading(true);
    try {
      setPhotoUrl(await uploadToCloudinary(file));
      setFormError('');
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload some media.') });
    } finally {
      setUploading(false);
    }
  };

  const toggleFlagged = (id: string, on: boolean) => {
    setFlagged((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
    if (formError) setFormError('');
  };

  const onNoteChange = (value: string) => {
    setNote(value);
    if (formError) setFormError('');
  };

  const busy = isPending || unvoting || locating;
  const my = point.my_vote;
  // The side shown as chosen: the open "not clean" form wins over the saved vote.
  const selected: MeetingPointVoteValue | null = downOpen ? 'down' : (my?.value ?? null);

  /** Clicking the side of one's saved vote takes it back. */
  const unvote = (side: MeetingPointVoteValue) => {
    setActing(side);
    unvoteMutate({ campaign_id: campaignId, meeting_point_id: point.meeting_point_id });
  };

  const onClickClean = () => {
    if (my?.value === 'up' && !downOpen) return unvote('up');
    if (downOpen) cancelDown();
    void vote('up');
  };

  const onClickNotClean = () => {
    if (my?.value === 'down') return unvote('down');
    if (downOpen) return cancelDown();
    setDownOpen(true);
    setFormError('');
  };

  return {
    downOpen,
    note,
    onNoteChange,
    photoUrl,
    setPhotoUrl,
    flagged,
    toggleFlagged,
    uploading,
    locating,
    formError,
    acting,
    busy,
    selected,
    cancelDown,
    vote,
    onPickPhoto,
    onClickClean,
    onClickNotClean,
  };
}
