import { memo, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TbFlagCheck } from 'react-icons/tb';

import { useMarkDoneCampaign } from '@/apis/campaign/campaignById';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useCompletionReview } from '@/apis/campaign/processCampaign';
import { useShiftOverview } from '@/apis/campaign/shiftResult';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

/** Reason for a waste point no shift handled (server: 1–500 characters). */
const REASON_MAX = 500;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-3 py-2">
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * "Mark done" for the campaign's managers (spec 5.1). Opens once every shift that is on has ended;
 * the dialog sums up the shifts' results (built by the server into the submission) and asks a
 * reason for each waste point no shift handled, then sends it to the admin.
 */
export const SubmitCompletionDialog = memo(function SubmitCompletionDialog({
  campaign,
}: {
  campaign: ICampaign;
}) {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);

  const { data: overviewData } = useShiftOverview(campaign.id, { enabled: Boolean(campaign.id) });
  const notEnded = overviewData?.data?.totals.not_ended_shift_ids.length ?? 0;
  const { data, isLoading } = useCompletionReview(campaign.id, { enabled: open });
  const review = data?.data;

  const { mutate, isPending } = useMarkDoneCampaign({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] });
      void queryClient.invalidateQueries({ queryKey: ['shift-overview', campaign.id] });
      void queryClient.invalidateQueries({ queryKey: ['completion-review', campaign.id] });
      setOpen(false);
    },
  });

  const reportById = useMemo(
    () => new Map((campaign.reports ?? []).map((r) => [r.id, r])),
    [campaign.reports],
  );
  const pointName = (id: string | null) => {
    const points = campaign.meeting_points ?? [];
    const index = points.findIndex((p) => p.id === id);
    if (index < 0) return '';
    return points[index].name?.trim() || t('Meeting point {{n}}', { n: index + 1 });
  };
  const reportTitle = (id: string, fallback?: string | null) => {
    const r = reportById.get(id);
    return (r && localizedTitle(r).trim()) || fallback || t('Waste point');
  };

  const unhandled = (review?.submission.reports ?? []).filter((r) => r.status === 'unhandled');
  const missing = unhandled.filter((r) => !reasons[r.report_id]?.trim());

  const onSubmit = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      return;
    }
    mutate({
      id: campaign.id,
      unhandled: unhandled.map((r) => ({ report_id: r.report_id, reason: reasons[r.report_id].trim() })),
    });
  };

  if (notEnded > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button type="button" variant="brown" size="medium" className="!h-[45px]" isDisabled>
              {t('Mark done')}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{t('{{n}} shift(s) not ended yet', { n: notEnded })}</TooltipContent>
      </Tooltip>
    );
  }

  const totals = review?.totals;
  const counts = review?.submission.counts;

  return (
    <>
      <Button
        type="button"
        variant="brown"
        size="medium"
        className="!h-[45px]"
        iconLeft={<TbFlagCheck className="size-5" aria-hidden />}
        onClick={() => {
          setReasons({});
          setShowErrors(false);
          setOpen(true);
        }}
      >
        {t('Mark done')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Mark Campaign as Done')}</DialogTitle>
            <DialogDescription>
              {t(
                'The results of every shift are sent to the admin for approval. Residents nearby are invited to confirm the area is clean.',
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !review || !totals || !counts ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label={t('Cleaned')} value={String(counts.cleaned)} />
                <Stat label={t('Partly done')} value={String(counts.partial)} />
                <Stat label={t('Not handled')} value={String(counts.unhandled)} />
                <Stat label={t('Present / registered')} value={`${totals.present} / ${totals.registered}`} />
                <Stat label={t('Bags')} value={String(totals.waste_bags)} />
                <Stat label={t('Weight (kg)')} value={String(totals.waste_kg)} />
              </div>

              {unhandled.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">{t('Waste points no shift handled')}</h3>
                    <p className="text-xs text-foreground-tertiary">
                      {t('Say why for each one; they go back to the waiting list once the admin approves.')}
                    </p>
                  </div>
                  {unhandled.map((r) => {
                    const empty = showErrors && !reasons[r.report_id]?.trim();
                    const point = pointName(r.meeting_point_id);
                    return (
                      <label key={r.report_id} className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">
                          {reportTitle(r.report_id, r.report?.title)}
                          {point && <span className="font-normal text-foreground-tertiary"> · {point}</span>}
                          <span className="text-destructive"> *</span>
                        </span>
                        <Textarea
                          rows={2}
                          maxLength={REASON_MAX}
                          value={reasons[r.report_id] ?? ''}
                          placeholder={t('Why it was not handled')}
                          aria-invalid={empty}
                          onChange={(e) => setReasons((prev) => ({ ...prev, [r.report_id]: e.target.value }))}
                        />
                        {empty && <span className="text-xs text-destructive">{t('A reason is required')}</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isLoading={isPending}
              isDisabled={isPending || isLoading || !review}
              onClick={onSubmit}
            >
              {t('Send for approval')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default SubmitCompletionDialog;
