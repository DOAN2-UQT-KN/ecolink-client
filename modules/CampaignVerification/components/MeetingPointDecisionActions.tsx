import { memo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useDecideMeetingPoint } from '@/apis/campaign/decideMeetingPoint';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

const REASON_MAX = 1000;

/**
 * Admin, on a flagged meeting point: verify it, or reject it with a reason and the trash points
 * that did not pass (the team sees both, and the shifts that submitted those trash points are
 * reopened when the campaign is rejected).
 */
export const MeetingPointDecisionActions = /* @__PURE__ */ memo(function MeetingPointDecisionActions({
  campaignId,
  meetingPointId,
  trashPoints,
  isDark,
  className,
}: {
  campaignId: string;
  meetingPointId: string;
  /** The round's cleaned trash points, to pick those that did not pass. */
  trashPoints: { id: string; title: string }[];
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [failed, setFailed] = useState<string[]>([]);
  const [error, setError] = useState('');
  const { mutate, isPending, variables } = useDecideMeetingPoint({
    onSuccess: (_res, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['campaign-verification', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setRejecting(false);
      setReason('');
      setFailed([]);
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: vars.decision === 'verify' ? t('Meeting point verified') : t('Meeting point not accepted'),
      });
    },
  });

  const inputDark = isDark && 'border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500';

  const toggle = (id: string, on: boolean) => {
    setFailed((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
    if (error) setError('');
  };

  const reject = () => {
    const text = reason.trim();
    if (!text) {
      setError(t('A reason is required'));
      return;
    }
    if (failed.length === 0) {
      setError(t('Pick at least one waste point that did not pass'));
      return;
    }
    mutate({
      campaign_id: campaignId,
      meeting_point_id: meetingPointId,
      decision: 'reject',
      reason: text,
      report_ids: failed,
    });
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => mutate({ campaign_id: campaignId, meeting_point_id: meetingPointId, decision: 'verify' })}
        >
          {isPending && variables?.decision === 'verify' ? `${t('Saving')}…` : t('Verify')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={rejecting ? 'outline' : 'destructive'}
          disabled={isPending}
          onClick={() => {
            setRejecting((v) => !v);
            setError('');
          }}
        >
          {rejecting ? t('Cancel') : t('Reject')}
        </Button>
      </div>
      {rejecting && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            {t('Which waste points did not pass?')} <span className="text-destructive">*</span>
          </span>
          <div className="flex flex-col gap-1.5">
            {trashPoints.map((tp) => {
              const id = `reject-${meetingPointId}-${tp.id}`;
              return (
                <label key={tp.id} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    id={id}
                    checked={failed.includes(tp.id)}
                    disabled={isPending}
                    onCheckedChange={(v) => toggle(tp.id, v === true)}
                  />
                  {tp.title}
                </label>
              );
            })}
          </div>
          <Textarea
            value={reason}
            maxLength={REASON_MAX}
            disabled={isPending}
            placeholder={t('The team sees this reason')}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            className={cn('min-h-20', inputDark)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="w-fit"
            disabled={isPending}
            onClick={reject}
          >
            {t('Reject this meeting point')}
          </Button>
        </div>
      )}
    </div>
  );
});
