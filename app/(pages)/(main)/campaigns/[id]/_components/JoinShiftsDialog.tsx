import { memo, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TriangleAlert } from 'lucide-react';

import {
  useGetRegistrationOptions,
  useUpdateMyRegistrations,
} from '@/apis/campaign/registration';
import type { IRegistrationOptionShift } from '@/apis/campaign/models/registration';
import { Button } from '@/components/client/shared/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import { ShiftFillBar } from './ShiftFillBar';

/** Same window as the server's `CAMPAIGN_FREE_LEAVE_HOURS`. */
const FREE_LEAVE_HOURS = 24;

const hhmm = (iso: string) => format(new Date(iso), 'HH:mm');
const overlaps = (a: IRegistrationOptionShift, b: IRegistrationOptionShift) =>
  new Date(a.start_at).getTime() < new Date(b.end_at).getTime() &&
  new Date(b.start_at).getTime() < new Date(a.end_at).getTime();
const hasStarted = (shift: IRegistrationOptionShift) =>
  new Date(shift.start_at).getTime() <= Date.now();

function Label({ tone, children, title }: { tone: 'orange'; children: string; title?: string }) {
  const label = (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone === 'orange' && 'bg-orange-100 text-orange-800',
      )}
    >
      {children}
    </span>
  );
  if (!title) return label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

/**
 * "Pick shifts" popup (spec 3.1): the shifts that can still be joined, grouped by day, with how
 * many signed up and labels for short, over the expected maximum and overlapping shifts. Nothing
 * here blocks: warnings show and the volunteer can still confirm. Unticking a shift they hold
 * leaves it.
 */
export const JoinShiftsDialog = memo(function JoinShiftsDialog({
  campaignId,
  open,
  onOpenChange,
}: {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetRegistrationOptions(campaignId, {
    enabled: open && Boolean(campaignId),
  });
  const options = data?.data;
  const shifts = useMemo(() => options?.shifts ?? [], [options]);
  const held = useMemo(() => shifts.filter((s) => s.registered_by_me).map((s) => s.id), [shifts]);
  const isEditing = held.length > 0;

  const [ticked, setTicked] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);

  // Fresh selection each time it opens: what the viewer holds, or the only shift there is.
  useEffect(() => {
    if (!open || !options) return;
    setTicked(held.length > 0 ? held : shifts.length === 1 ? [shifts[0].id] : []);
    setAccepted(false);
  }, [open, options, held, shifts]);

  const { mutate, isPending } = useUpdateMyRegistrations({
    onSuccess: (response) => {
      const result = response.data;
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title:
          result.shift_ids.length === 0
            ? t('You left the campaign')
            : isEditing
              ? t('Your shifts were updated')
              : t('You registered for {{n}} shift(s)', { n: result.shift_ids.length }),
      });
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-registrations', campaignId] });
      onOpenChange(false);
    },
  });

  const added = ticked.filter((id) => !held.includes(id));
  const removed = held.filter((id) => !ticked.includes(id));
  const changed = added.length > 0 || removed.length > 0;
  const canConfirm =
    changed && (added.length === 0 || accepted) && (ticked.length > 0 || isEditing);

  const days = useMemo(() => {
    const byDay = new Map<string, IRegistrationOptionShift[]>();
    for (const s of shifts) byDay.set(s.day_id, [...(byDay.get(s.day_id) ?? []), s]);
    return (options?.days ?? [])
      .map((day, index) => ({ day, index, shifts: byDay.get(day.id) ?? [] }))
      .filter((d) => d.shifts.length > 0);
  }, [options, shifts]);

  const lateLeaving = removed.some((id) => {
    const shift = shifts.find((s) => s.id === id);
    return shift && new Date(shift.start_at).getTime() - Date.now() < FREE_LEAVE_HOURS * 3600 * 1000;
  });

  const toggle = (id: string, on: boolean) =>
    setTicked((current) => (on ? [...current, id] : current.filter((x) => x !== id)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-3xl border border-[rgba(136,122,71,0.35)] bg-white sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display-5 !text-button-accent">
            {isEditing ? t('Edit my shifts') : t('Choose your shifts')}
            <InfoTooltip
              content={t(
                'Registration takes effect at once. It keeps you informed and helps the organizers plan; attendance is taken on the day.',
              )}
            />
          </DialogTitle>
        </DialogHeader>

        {isLoading || !options ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
            {options.many_absences && (
              <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-800">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t(
                  'You missed {{n}} shifts you had registered for in the last 90 days. Please only register for shifts you can attend.',
                  { n: options.absence_count },
                )}
              </p>
            )}

            {days.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('The campaign has no more upcoming shifts')}
              </p>
            )}

            {days.map(({ day, index, shifts: dayShifts }) => (
              <section key={day.id} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('Day {{n}}', { n: index + 1 })} · {format(new Date(day.start_at), 'EEEE, PP')}
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {dayShifts.map((shift) => {
                    const checked = ticked.includes(shift.id);
                    const locked = hasStarted(shift);
                    const mineOverlap = shifts.some(
                      (other) =>
                        other.id !== shift.id &&
                        (ticked.includes(other.id) || other.registered_by_me) &&
                        overlaps(shift, other),
                    );
                    const overlapTitle = [
                      ...shift.conflicts.map(
                        (c) => `${c.campaign_title} · ${hhmm(c.start_at)} – ${hhmm(c.end_at)}`,
                      ),
                      ...(mineOverlap ? [t('Another shift you picked in this campaign')] : []),
                    ].join('\n');
                    return (
                      <li key={shift.id} className="flex">
                        <label
                          className={cn(
                            'flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-[rgba(136,122,71,0.3)] bg-white p-4 text-sm transition-colors',
                            checked && 'border-[#887A47] bg-[#887A47]/10',
                            locked && 'cursor-not-allowed opacity-70',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="font-semibold">
                                {shift.meeting_point_name || t('Meeting point')}
                              </span>
                              {(shift.conflicts.length > 0 || (checked && mineOverlap)) && (
                                <Label tone="orange" title={overlapTitle}>
                                  {t('Time overlap')}
                                </Label>
                              )}
                            </div>
                            <Checkbox
                              checked={checked}
                              disabled={locked}
                              onCheckedChange={(value) => toggle(shift.id, value === true)}
                              aria-label={shift.meeting_point_name ?? t('Meeting point')}
                            />
                          </div>
                            {shift.meeting_point_address && (
                              <span className="text-xs text-muted-foreground">
                                {shift.meeting_point_address}
                              </span>
                            )}
                            <span className="tabular-nums">
                              {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
                            </span>
                            {shift.gather_at && (
                              <span className="text-xs text-foreground-tertiary">
                                {t('Gathers at {{time}}', { time: hhmm(shift.gather_at) })}
                              </span>
                            )}
                            <ShiftFillBar
                              className="mt-2"
                              registered={shift.registered_count}
                              min={shift.min_volunteers}
                              max={shift.max_volunteers}
                            />
                            {locked && (
                              <span className="text-xs text-muted-foreground">
                                {t('This shift has started')}
                              </span>
                            )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {added.length > 0 && (
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={accepted}
                  onCheckedChange={(value) => setAccepted(value === true)}
                />
                {t('I meet the participation conditions and have read the safety notes')}
              </label>
            )}

            {lateLeaving && (
              <p className="text-sm text-amber-700">
                {t(
                  'A shift you are leaving starts within 24 hours; this is recorded as a late leave.',
                )}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outlined-brown" size="medium" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            variant="brown"
            size="medium"
            isLoading={isPending}
            isDisabled={!canConfirm}
            onClick={() =>
              mutate({ campaign_id: campaignId, shift_ids: ticked, accept_conditions: accepted })
            }
          >
            {isEditing && ticked.length === 0 ? t('Leave the campaign') : t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default JoinShiftsDialog;
