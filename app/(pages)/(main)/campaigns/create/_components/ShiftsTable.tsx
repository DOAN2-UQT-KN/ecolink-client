import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Button } from '@/components/client/shared/Button';
import { cn } from '@/libs/utils';

import { useCampaign } from '../_context/CampaignContext';
import { useShiftRules } from '../_hooks/useShiftRules';
import { copyFirstDayToAll, dayHours, dayMinTotal } from '../_services/shiftSchedule.service';
import ShiftTimeWindow from './ShiftTimeWindow';
import ShiftLeaderSelect from './ShiftLeaderSelect';
import type { ShiftsViewProps } from './StepShifts';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';
const cellClass = 'border border-[rgba(136,122,71,0.3)] px-3 py-2 align-top';

/** The day × meeting point grid: one row per shift. */
export default function ShiftsTable({
  days,
  points,
  schedule,
  members,
  belowSuggestion,
  dayMessages,
  cellErrors,
  dayLabel,
  pointName,
}: ShiftsViewProps) {
  const { t } = useTranslation();
  const { form, suggestedMinPerDay } = useCampaign();
  const { register, setValue, getValues, trigger } = form;
  const rules = useShiftRules();

  const applyFirstDayToAll = () => {
    setValue('schedule', copyFirstDayToAll(getValues()), { shouldDirty: true });
    void trigger('schedule');
  };

  const leaderHint = t(
    "Only the campaign's managers and the organization's owners can lead a shift. Add managers on the campaign page.",
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {t('Volunteers per shift')}
          </span>
          <InfoTooltip
            content={t(
              'Each row is a shift: one meeting point on one day. Enter the minimum volunteers it needs (0 turns it off) and, optionally, the most you expect. Neither number blocks sign-ups; they only raise warnings.',
            )}
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
              const total = dayMinTotal(row);
              const below = belowSuggestion.includes(d);
              const span = Math.max(points.length, 1);
              return (
                <Fragment key={d}>
                  {points.map((_, p) => {
                    const off = row[p]?.min_volunteers === 0;
                    const errors = cellErrors(d, p);
                    const label = `${dayLabel(day, d)} · ${pointName(p)}`;
                    return (
                      <tr key={p} className={cn(off && 'bg-zinc-50')}>
                        {p === 0 && (
                          <td rowSpan={span} className={cn(cellClass, 'whitespace-nowrap')}>
                            <div className="font-medium">{dayLabel(day, d)}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {dayHours(days[d])}
                            </div>
                          </td>
                        )}
                        <td className={cn(cellClass, off && 'text-muted-foreground')}>
                          {pointName(p)}
                        </td>
                        <td className={cellClass}>
                          <ShiftTimeWindow d={d} p={p} day={days[d]} label={label} disabled={off} />
                          <FieldError errors={[errors?.start_time]} />
                        </td>
                        <td className={cellClass}>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              aria-label={`${label} · ${t('Min')}`}
                              placeholder={t('Min')}
                              {...register(`schedule.${d}.${p}.min_volunteers`, rules.min(d, p))}
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
                              aria-label={`${label} · ${t('Max (optional)')}`}
                              placeholder={t('Max (optional)')}
                              disabled={off}
                              {...register(`schedule.${d}.${p}.max_volunteers`, rules.max(d, p))}
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
                            aria-label={`${label} · ${t('Gathering time')}`}
                            max={row[p]?.end_time || day.end_time || undefined}
                            disabled={off}
                            {...register(`schedule.${d}.${p}.gather_time`, rules.gather(d, p))}
                            className={cn(
                              inputClassName,
                              'min-w-[120px]',
                              off && 'opacity-50',
                            )}
                          />
                          <FieldError errors={[errors?.gather_time]} />
                        </td>
                        <td className={cellClass}>
                          <ShiftLeaderSelect d={d} p={p} members={members} disabled={off} />
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
    </>
  );
}
