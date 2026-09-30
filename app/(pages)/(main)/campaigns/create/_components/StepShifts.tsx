import { memo, useCallback, useEffect, useMemo } from 'react';
import { Controller, type FieldError as RHFFieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
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
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { cn } from '@/libs/utils';

import { useCampaign } from '../_hooks/useCampaign';
import { fitSchedule, type CampaignFormValues } from '../_services/campaign.service';
import useAuthStore from '@/stores/useAuthStore';
import { parseApiDate } from './ScheduleFields';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

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
 * Step 4 (spec 1.4): volunteers per shift, one shift per day × meeting point. 0 slots turns a
 * shift off; each day needs one shift on and stays within the per-day cap of the difficulty.
 * A one-day, one-point campaign shows a single volunteers field.
 */
const StepShifts = memo(function StepShifts() {
  const { t } = useTranslation();
  const { form, maxPerDay } = useCampaign();
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

  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId, page: 1, limit: 100 },
    { enabled: Boolean(organizationId) },
  );
  const members = membersData?.data?.members ?? [];

  const pointName = useCallback(
    (index: number) => points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 }),
    [points, t],
  );

  /** Day 1's slots, leaders and gathering offsets, copied to the other days. */
  const applyFirstDayToAll = useCallback(() => {
    const values = getValues();
    const first = values.schedule[0] ?? [];
    const firstStart = minutesOf(values.days[0]?.start_time);
    const next = values.schedule.map((row, d) => {
      if (d === 0) return row;
      const start = minutesOf(values.days[d]?.start_time);
      return row.map((_, p) => {
        const source = first[p];
        if (!source) return row[p];
        const gather = minutesOf(source.gather_time);
        return {
          slots: source.slots,
          leader_user_id: source.leader_user_id,
          gather_time:
            gather != null && firstStart != null && start != null
              ? timeOf(start + (gather - firstStart))
              : source.gather_time,
        };
      });
    });
    setValue('schedule', next, { shouldDirty: true });
    void trigger('schedule');
  }, [getValues, setValue, trigger]);

  const slotsRules = useCallback(
    (d: number, p: number) => ({
      setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)),
      validate: (v: number | null, values: CampaignFormValues) => {
        if (v == null || Number.isNaN(v)) {
          return t('Enter the number of volunteers (0 turns the shift off)');
        }
        if (!Number.isInteger(v) || v < 0) {
          return t('Slots must be a whole number, 0 to turn the shift off');
        }
        // Checks on the whole day live on its first shift.
        if (p !== 0) return true;
        const row = (values.schedule[d] ?? []).map((c) => Number(c?.slots) || 0);
        const total = row.reduce((a, b) => a + b, 0);
        const allFilled = (values.schedule[d] ?? []).every((c) => c?.slots != null);
        if (allFilled && total === 0) return t('Each day needs at least one shift with slots');
        if (maxPerDay != null && total > maxPerDay) {
          return t('Slots on this day ({{total}}) exceed the {{max}} volunteers allowed per day', {
            total,
            max: maxPerDay,
          });
        }
        return true;
      },
    }),
    [maxPerDay, t],
  );

  const gatherRules = useCallback(
    (d: number, p: number) => ({
      validate: (v: string, values: CampaignFormValues) => {
        if (!v || !(Number(values.schedule[d]?.[p]?.slots) > 0)) return true;
        const end = minutesOf(values.days[d]?.end_time);
        const gather = minutesOf(v);
        return end == null || gather == null || gather <= end
          ? true
          : t('Gathering time must be on that day, before it ends');
      },
    }),
    [t],
  );

  const scheduleErrors = formState.errors.schedule;
  /** Messages for day `d`: its cells, and the server's day-level ones. */
  const dayMessages = useMemo(
    () =>
      days.map((_, d) => {
        const row = scheduleErrors?.[d] as
          | (Record<number, { slots?: RHFFieldError }> & { message?: string })
          | undefined;
        const messages = new Set<string>();
        if (row?.message) messages.add(row.message);
        points.forEach((__, p) => {
          const message = row?.[p]?.slots?.message;
          if (message) messages.add(message);
        });
        return [...messages];
      }),
    [days, points, scheduleErrors],
  );

  const leaderSelect = (d: number, p: number) => (
    <Controller
      name={`schedule.${d}.${p}.leader_user_id`}
      control={control}
      rules={{
        validate: (v, values) =>
          !(Number(values.schedule[d]?.[p]?.slots) > 0) ||
          Boolean(v) ||
          t('Choose who is in charge of this shift'),
      }}
      render={({ field }) => (
        <Select value={field.value || undefined} onValueChange={field.onChange}>
          <SelectTrigger className={`${inputClassName} !h-[50px] w-full`}>
            <SelectValue placeholder={t('Choose a member')} />
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
          {maxPerDay != null && (
            <InfoTooltip
              content={t('At most {{max}} volunteers per day for this difficulty', { max: maxPerDay })}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Number of volunteers')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="number"
              min={0}
              {...register('schedule.0.0.slots', slotsRules(0, 0))}
              className={inputClassName}
            />
            <FieldError errors={[errors?.slots]} />
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Gathering time')}
            </FieldLabel>
            <Input
              type="time"
              {...register('schedule.0.0.gather_time', gatherRules(0, 0))}
              className={inputClassName}
            />
            <FieldError errors={[errors?.gather_time]} />
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Person in charge')} <span className="text-destructive">*</span>
            </FieldLabel>
            {leaderSelect(0, 0)}
            <FieldError errors={[errors?.leader_user_id]} />
          </Field>
        </div>
        <FieldError errors={dayMessages[0].map((message) => ({ message }))} />
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
          <InfoTooltip
            content={
              maxPerDay != null
                ? t(
                    'Each cell is a shift: one meeting point on one day. Enter 0 to turn a shift off. Each day needs one shift on, and at most {{max}} volunteers in total.',
                    { max: maxPerDay },
                  )
                : t(
                    'Each cell is a shift: one meeting point on one day. Enter 0 to turn a shift off. Each day needs one shift on.',
                  )
            }
          />
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
              <th className="border border-[rgba(136,122,71,0.3)] px-3 py-2 text-left">{t('Day')}</th>
              {points.map((_, p) => (
                <th key={p} className="border border-[rgba(136,122,71,0.3)] px-3 py-2 text-left">
                  {pointName(p)}
                </th>
              ))}
              <th className="border border-[rgba(136,122,71,0.3)] px-3 py-2 text-left">
                {t('Total per day')}
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, d) => {
              const row = schedule[d] ?? [];
              const total = row.reduce((sum, c) => sum + (Number(c?.slots) || 0), 0);
              const over = maxPerDay != null && total > maxPerDay;
              return (
                <tr key={d}>
                  <td className="border border-[rgba(136,122,71,0.3)] px-3 py-2 whitespace-nowrap">
                    {dayLabel(day, d)}
                  </td>
                  {points.map((_, p) => {
                    const off = row[p]?.slots === 0;
                    return (
                      <td key={p} className="border border-[rgba(136,122,71,0.3)] px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          aria-label={`${dayLabel(day, d)} · ${pointName(p)}`}
                          {...register(`schedule.${d}.${p}.slots`, slotsRules(d, p))}
                          className={cn(
                            inputClassName,
                            'min-w-[80px] tabular-nums',
                            off && 'bg-zinc-100 text-muted-foreground',
                            cellErrors(d, p)?.slots && 'border-destructive',
                          )}
                        />
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      'border border-[rgba(136,122,71,0.3)] px-3 py-2 font-semibold tabular-nums',
                      over && 'text-destructive',
                    )}
                  >
                    {total}
                    {maxPerDay != null && ` / ${maxPerDay}`}
                  </td>
                </tr>
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

      <div className="flex flex-col gap-4">
        <span className="font-display-4 font-semibold">{t('Shift details')}</span>
        {days.map((day, d) => {
          const active = points
            .map((_, p) => p)
            .filter((p) => Number(schedule[d]?.[p]?.slots) > 0);
          if (active.length === 0) return null;
          return (
            <div
              key={d}
              className="flex flex-col gap-3 rounded-[10px] border border-[rgba(136,122,71,0.3)] p-4"
            >
              <span className="font-semibold">{dayLabel(day, d)}</span>
              {active.map((p) => {
                const errors = cellErrors(d, p);
                return (
                  <div key={p} className="grid grid-cols-1 md:grid-cols-[1fr_160px_1fr] gap-3 items-start">
                    <span className="pt-3 text-sm">
                      {pointName(p)} · {schedule[d]?.[p]?.slots} {t('volunteers')}
                    </span>
                    <Field>
                      <Input
                        type="time"
                        aria-label={t('Gathering time')}
                        {...register(`schedule.${d}.${p}.gather_time`, gatherRules(d, p))}
                        className={inputClassName}
                      />
                      <FieldError errors={[errors?.gather_time]} />
                    </Field>
                    <Field>
                      {leaderSelect(d, p)}
                      <FieldError errors={[errors?.leader_user_id]} />
                    </Field>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default StepShifts;
