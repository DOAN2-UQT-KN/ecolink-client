import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { Controller, type FieldError as RHFFieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/client/shared/Button';
import { cn } from '@/libs/utils';

import { useCampaign } from '../_hooks/useCampaign';
import { useLeaderOptions } from '../../_hooks/useLeaderOptions';
import { fitSchedule, type CampaignFormValues } from '../_services/campaign.service';
import useAuthStore from '@/stores/useAuthStore';
import { parseApiDate } from './ScheduleFields';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';
const cellClass = 'border border-[rgba(136,122,71,0.3)] px-3 py-2 align-top';

const minutesOf = (time?: string): number | null => {
  const m = time?.match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const timeOf = (minutes: number): string => {
  const clamped = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  return `${`${Math.floor(clamped / 60)}`.padStart(2, '0')}:${`${clamped % 60}`.padStart(2, '0')}`;
};

/** "Day 1 · Oct 5" */
export function useDayLabel() {
  const { t } = useTranslation();
  return useCallback(
    (day: CampaignFormValues['days'][number], index: number) => {
      const date = parseApiDate(day.date);
      return date
        ? `${t('Day {{n}}', { n: index + 1 })} · ${format(date, 'PP')}`
        : t('Day {{n}}', { n: index + 1 });
    },
    [t],
  );
}

/**
 * Step 4 (spec 1.4): volunteers per shift, one shift per day × meeting point. Each shift has its
 * hours (the day's by default), a minimum (0 turns it off) and an optional expected maximum;
 * neither caps sign-ups. Each day
 * needs one shift on; a day below the difficulty's suggested minimum needs a reason. A one-day,
 * one-point campaign shows a single set of fields.
 */
const StepShifts = memo(function StepShifts() {
  const { t } = useTranslation();
  const { form, suggestedMinPerDay, campaign } = useCampaign();
  const { control, register, watch, setValue, getValues, trigger, formState } = form;
  const days = watch('days');
  const points = watch('meeting_points');
  const schedule = watch('schedule');
  const organizationId = watch('organization_id');
  const dayLabel = useDayLabel();
  const single = days.length === 1 && points.length === 1;
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';

  // The grid always matches the days and meeting points, even for drafts saved before a change.
  useEffect(() => {
    const shaped =
      schedule.length === days.length && schedule.every((row) => row.length === points.length);
    if (!shaped) {
      setValue('schedule', fitSchedule(schedule, days.length, points.length, currentUserId));
    }
  }, [currentUserId, days.length, points.length, schedule, setValue]);

  // Only the campaign's team may lead a shift (spec 3.4).
  const members = useLeaderOptions({
    organizationId,
    campaignId: campaign?.id,
    createdBy: campaign?.created_by ?? currentUserId,
  });

  const pointName = useCallback(
    (index: number) => points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 }),
    [points, t],
  );

  /** Day 1's volunteer numbers, leaders and time offsets, copied to the other days. */
  const applyFirstDayToAll = useCallback(() => {
    const values = getValues();
    const first = values.schedule[0] ?? [];
    const firstStart = minutesOf(values.days[0]?.start_time);
    const next = values.schedule.map((row, d) => {
      if (d === 0) return row;
      const start = minutesOf(values.days[d]?.start_time);
      // Same distance from the day's start; "" (the day's hours) stays "".
      const shifted = (time: string) => {
        const m = minutesOf(time);
        return m != null && firstStart != null && start != null
          ? timeOf(start + (m - firstStart))
          : time;
      };
      return row.map((_, p) => {
        const source = first[p];
        if (!source) return row[p];
        return {
          min_volunteers: source.min_volunteers,
          max_volunteers: source.max_volunteers,
          leader_user_id: source.leader_user_id,
          start_time: shifted(source.start_time),
          end_time: shifted(source.end_time),
          gather_time: shifted(source.gather_time),
        };
      });
    });
    setValue('schedule', next, { shouldDirty: true });
    void trigger('schedule');
  }, [getValues, setValue, trigger]);

  const toNumber = (v: unknown) => (v === '' || v == null ? null : Number(v));

  const minRules = useCallback(
    (d: number, p: number) => ({
      setValueAs: toNumber,
      validate: (v: number | null, values: CampaignFormValues) => {
        if (v == null || Number.isNaN(v)) {
          return t('Enter the minimum volunteers (0 turns the shift off)');
        }
        if (!Number.isInteger(v) || v < 0) {
          return t('Minimum volunteers must be a whole number, 0 to turn the shift off');
        }
        // Checks on the whole day live on its first shift.
        if (p !== 0) return true;
        const cells = values.schedule[d] ?? [];
        const total = cells.reduce((sum, c) => sum + (Number(c?.min_volunteers) || 0), 0);
        const allFilled = cells.every((c) => c?.min_volunteers != null);
        if (allFilled && total === 0) return t('Each day needs at least one shift that runs');
        return true;
      },
    }),
    [t],
  );

  const maxRules = useCallback(
    (d: number, p: number) => ({
      setValueAs: toNumber,
      validate: (v: number | null, values: CampaignFormValues) => {
        if (v == null || Number.isNaN(v)) return true;
        const min = Number(values.schedule[d]?.[p]?.min_volunteers) || 0;
        if (min === 0) return true;
        return Number.isInteger(v) && v >= min
          ? true
          : t('The expected maximum must be a whole number no lower than the minimum');
      },
    }),
    [t],
  );

  /** Days whose total minimum is under what the difficulty suggests. */
  const belowSuggestion = useMemo(
    () =>
      suggestedMinPerDay == null
        ? []
        : days
            .map((_, d) => d)
            .filter((d) => {
              const total = (schedule[d] ?? []).reduce(
                (sum, c) => sum + (Number(c?.min_volunteers) || 0),
                0,
              );
              return total > 0 && total < suggestedMinPerDay;
            }),
    [days, schedule, suggestedMinPerDay],
  );

  const reasonField = belowSuggestion.length > 0 && (
    <Field>
      <FieldLabel className="text-foreground-tertiary font-display-3">
        {t('Why fewer volunteers than suggested')} <span className="text-destructive">*</span>
        <InfoTooltip
          content={t(
            'This difficulty suggests at least {{n}} volunteers per day. Explain why fewer are enough; the admin reads this when reviewing.',
            { n: suggestedMinPerDay },
          )}
        />
      </FieldLabel>
      <Textarea
        rows={3}
        maxLength={1000}
        {...register('min_volunteers_reason', {
          validate: (v, values) => {
            const low =
              suggestedMinPerDay != null &&
              values.schedule.some((row) => {
                const total = row.reduce((sum, c) => sum + (Number(c?.min_volunteers) || 0), 0);
                return total > 0 && total < suggestedMinPerDay;
              });
            return !low || Boolean(v?.trim()) || t('Explain why a day needs fewer volunteers than suggested for this difficulty');
          },
        })}
        className={inputClassName}
      />
      <FieldError errors={[formState.errors.min_volunteers_reason]} />
    </Field>
  );

  const gatherRules = useCallback(
    (d: number, p: number) => ({
      validate: (v: string, values: CampaignFormValues) => {
        if (!v || !(Number(values.schedule[d]?.[p]?.min_volunteers) > 0)) return true;
        const cell = values.schedule[d]?.[p];
        const start = minutesOf(cell?.start_time || values.days[d]?.start_time);
        const gather = minutesOf(v);
        return start == null || gather == null || gather <= start
          ? true
          : t('Gathering time must be no later than the shift starts');
      },
    }),
    [t],
  );

  /** A shift's window sits inside its day; checked on the start field. */
  const windowRules = useCallback(
    (d: number, p: number) => ({
      validate: (_: string, values: CampaignFormValues) => {
        const cell = values.schedule[d]?.[p];
        if (!(Number(cell?.min_volunteers) > 0)) return true;
        const day = values.days[d];
        const dayStart = minutesOf(day?.start_time);
        const dayEnd = minutesOf(day?.end_time);
        const start = minutesOf(cell?.start_time || day?.start_time);
        const end = minutesOf(cell?.end_time || day?.end_time);
        if (dayStart == null || dayEnd == null || start == null || end == null) return true;
        return start < end && start >= dayStart && end <= dayEnd
          ? true
          : t("A shift must start before it ends, within the day's hours");
      },
    }),
    [t],
  );

  /** Start or end of a shift; empty means the day's hour, which is what the input shows. */
  const shiftTimeInput = (d: number, p: number, which: 'start_time' | 'end_time', disabled: boolean) => {
    const dayTime = days[d]?.[which] ?? '';
    return (
      <Controller
        name={`schedule.${d}.${p}.${which}`}
        control={control}
        rules={which === 'start_time' ? windowRules(d, p) : undefined}
        render={({ field }) => (
          <Input
            type="time"
            aria-label={`${dayLabel(days[d], d)} · ${pointName(p)} · ${t(which === 'start_time' ? 'Shift start' : 'Shift end')}`}
            min={days[d]?.start_time || undefined}
            max={days[d]?.end_time || undefined}
            disabled={disabled}
            value={field.value || dayTime}
            onChange={(e) => {
              field.onChange(e.target.value === dayTime ? '' : e.target.value);
              void trigger(`schedule.${d}.${p}.start_time`);
            }}
            onBlur={field.onBlur}
            className={cn(inputClassName, 'w-[110px] tabular-nums', disabled && 'opacity-50')}
          />
        )}
      />
    );
  };

  const shiftWindow = (d: number, p: number, disabled = false) => (
    <div className="flex items-center gap-2">
      {shiftTimeInput(d, p, 'start_time', disabled)}
      <span className="text-muted-foreground">–</span>
      {shiftTimeInput(d, p, 'end_time', disabled)}
    </div>
  );

  const scheduleErrors = formState.errors.schedule;
  /** Messages for day `d`: its cells, and the server's day-level ones. */
  const dayMessages = useMemo(
    () =>
      days.map((_, d) => {
        const row = scheduleErrors?.[d] as
          | (Record<number, { min_volunteers?: RHFFieldError }> & { message?: string })
          | undefined;
        const messages = new Set<string>();
        if (row?.message) messages.add(row.message);
        points.forEach((__, p) => {
          const message = row?.[p]?.min_volunteers?.message;
          if (message) messages.add(message);
        });
        return [...messages];
      }),
    [days, points, scheduleErrors],
  );

  const leaderHint = t(
    "Only the campaign's managers and the organization's owners can lead a shift. Add managers on the campaign page.",
  );

  const leaderSelect = (d: number, p: number, disabled = false) => (
    <Controller
      name={`schedule.${d}.${p}.leader_user_id`}
      control={control}
      rules={{
        validate: (v, values) =>
          !(Number(values.schedule[d]?.[p]?.min_volunteers) > 0) ||
          Boolean(v) ||
          t('Choose who is in charge of this shift'),
      }}
      render={({ field }) => (
        <Select value={field.value || undefined} onValueChange={field.onChange} disabled={disabled}>
          <SelectTrigger className={`${inputClassName} !h-[50px] w-full min-w-[180px]`}>
            <SelectValue placeholder={t('Choose a manager')} />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.user?.name || m.user?.email || m.user_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  /** "07:00 – 11:00" for day `d`. */
  const dayHours = (d: number) => `${days[d]?.start_time || '—'} – ${days[d]?.end_time || '—'}`;

  const rangeHint = t(
    'Minimum – expected maximum (optional). 0 as the minimum turns the shift off.',
  );
  const shiftsHint = t(
    'Each row is a shift: one meeting point on one day. Enter the minimum volunteers it needs (0 turns it off) and, optionally, the most you expect. Neither number blocks sign-ups; they only raise warnings.',
  );
  const windowHint = t("A shift runs during the day's hours unless you narrow it.");

  const cellErrors = (d: number, p: number) =>
    (scheduleErrors?.[d] as Record<number, Record<string, RHFFieldError>> | undefined)?.[p];

  if (single) {
    const errors = cellErrors(0, 0);
    return (
      <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
        <div className="flex items-center gap-2">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {t('Volunteers')}
          </span>
          <InfoTooltip content={shiftsHint} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field className="md:col-span-2">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Volunteers needed')} <span className="text-destructive">*</span>
              <InfoTooltip content={rangeHint} />
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                aria-label={t('Min')}
                placeholder={t('Min')}
                {...register('schedule.0.0.min_volunteers', minRules(0, 0))}
                className={cn(inputClassName, 'w-[120px]')}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={1}
                aria-label={t('Max (optional)')}
                placeholder={t('Max (optional)')}
                {...register('schedule.0.0.max_volunteers', maxRules(0, 0))}
                className={cn(inputClassName, 'w-[160px]')}
              />
            </div>
            {belowSuggestion.includes(0) && (
              <span className="text-xs text-amber-600">
                {t('Suggested ≥ {{n}}', { n: suggestedMinPerDay })}
              </span>
            )}
            <FieldError errors={[errors?.min_volunteers, errors?.max_volunteers]} />
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Shift time')}
              <InfoTooltip content={windowHint} />
            </FieldLabel>
            {shiftWindow(0, 0)}
            <span className="text-xs text-foreground-tertiary">
              {dayLabel(days[0], 0)} · {dayHours(0)}
            </span>
            <FieldError errors={[errors?.start_time]} />
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Gathering time')}
            </FieldLabel>
            <Input
              type="time"
              max={schedule[0]?.[0]?.start_time || days[0]?.start_time || undefined}
              {...register('schedule.0.0.gather_time', gatherRules(0, 0))}
              className={inputClassName}
            />
            <FieldError errors={[errors?.gather_time]} />
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Person in charge')} <span className="text-destructive">*</span>
              <InfoTooltip content={leaderHint} />
            </FieldLabel>
            {leaderSelect(0, 0)}
            <FieldError errors={[errors?.leader_user_id]} />
          </Field>
        </div>
        <FieldError errors={dayMessages[0].map((message) => ({ message }))} />
        {reasonField}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {t('Volunteers per shift')}
          </span>
          <InfoTooltip content={shiftsHint} />
        </div>
        {days.length > 1 && (
          <Button type="button" variant="outlined-brown" onClick={applyFirstDayToAll}>
            {t('Apply to all days')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#887A47]/10">
              {[
                t('Day'),
                t('Meeting point'),
                t('Shift time'),
                t('Volunteers needed'),
                t('Gathering time'),
                t('Person in charge'),
                t('Total min'),
              ].map((header) => (
                <th key={header} className={cn(cellClass, 'text-left font-semibold whitespace-nowrap')}>
                  {header}
                  {header === t('Person in charge') && (
                    <span className="ml-1 inline-flex align-middle">
                      <InfoTooltip content={leaderHint} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, d) => {
              const row = schedule[d] ?? [];
              const total = row.reduce((sum, c) => sum + (Number(c?.min_volunteers) || 0), 0);
              const below = belowSuggestion.includes(d);
              const span = Math.max(points.length, 1);
              return (
                <Fragment key={d}>
                  {points.map((_, p) => {
                    const off = row[p]?.min_volunteers === 0;
                    const errors = cellErrors(d, p);
                    return (
                      <tr key={p} className={cn(off && 'bg-zinc-50')}>
                        {p === 0 && (
                          <td rowSpan={span} className={cn(cellClass, 'whitespace-nowrap')}>
                            <div className="font-medium">{dayLabel(day, d)}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {dayHours(d)}
                            </div>
                          </td>
                        )}
                        <td className={cn(cellClass, off && 'text-muted-foreground')}>
                          {pointName(p)}
                        </td>
                        <td className={cellClass}>
                          {shiftWindow(d, p, off)}
                          <FieldError errors={[errors?.start_time]} />
                        </td>
                        <td className={cellClass}>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              aria-label={`${dayLabel(day, d)} · ${pointName(p)} · ${t('Min')}`}
                              placeholder={t('Min')}
                              {...register(`schedule.${d}.${p}.min_volunteers`, minRules(d, p))}
                              className={cn(
                                inputClassName,
                                'w-[80px] tabular-nums',
                                off && 'bg-zinc-100 text-muted-foreground',
                                errors?.min_volunteers && 'border-destructive',
                              )}
                            />
                            <span className="text-muted-foreground">–</span>
                            <Input
                              type="number"
                              min={1}
                              aria-label={`${dayLabel(day, d)} · ${pointName(p)} · ${t('Max (optional)')}`}
                              placeholder={t('Max (optional)')}
                              disabled={off}
                              {...register(`schedule.${d}.${p}.max_volunteers`, maxRules(d, p))}
                              className={cn(
                                inputClassName,
                                'w-[110px] tabular-nums',
                                off && 'opacity-50',
                                errors?.max_volunteers && 'border-destructive',
                              )}
                            />
                          </div>
                          <FieldError errors={[errors?.max_volunteers]} />
                        </td>
                        <td className={cellClass}>
                          <Input
                            type="time"
                            aria-label={`${dayLabel(day, d)} · ${pointName(p)} · ${t('Gathering time')}`}
                            max={row[p]?.start_time || day.start_time || undefined}
                            disabled={off}
                            {...register(`schedule.${d}.${p}.gather_time`, gatherRules(d, p))}
                            className={cn(inputClassName, 'min-w-[120px]', off && 'opacity-50')}
                          />
                          <FieldError errors={[errors?.gather_time]} />
                        </td>
                        <td className={cellClass}>
                          {leaderSelect(d, p, off)}
                          <FieldError errors={[errors?.leader_user_id]} />
                        </td>
                        {p === 0 && (
                          <td
                            rowSpan={span}
                            className={cn(
                              cellClass,
                              'font-semibold tabular-nums whitespace-nowrap',
                              below && 'text-amber-600',
                            )}
                          >
                            {total}
                            {below && (
                              <div className="text-xs font-normal">
                                {t('Suggested ≥ {{n}}', { n: suggestedMinPerDay })}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {dayMessages.map((messages, d) =>
        messages.length > 0 ? (
          <p key={d} role="alert" className="text-sm text-destructive">
            {dayLabel(days[d], d)}: {messages.join(' · ')}
          </p>
        ) : null,
      )}
      {reasonField}
    </div>
  );
});

export default StepShifts;
