import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPlus, TbTrash } from 'react-icons/tb';

import {
  useMyAvailability,
  useUpdateAvailability,
  useUpdateAvailabilityLocation,
} from '@/apis/sos/availability';
import type { ISosAvailabilityWindow } from '@/apis/sos/models/sos';
import { Button } from '@/components/client/shared/Button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentPosition } from '@/libs/geo';
import { cn } from '@/libs/utils';
import { markAvailabilityLocationSent } from '@/components/sos/SosAvailabilityLocationSync';

/** Monday first, as Vietnamese calendars; values are JS days (0 = Sunday). */
const WEEK_DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const NEW_WINDOW: ISosAvailabilityWindow = { days: [6, 0], from: '07:00', to: '17:00' };

/** "Sẵn sàng hỗ trợ SOS": receive SOS invites from other campaigns nearby, in chosen time windows. */
export function ProfileSosAvailabilitySection() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyAvailability();
  const availability = data?.data;
  const [enabled, setEnabled] = useState(false);
  const [schedule, setSchedule] = useState<ISosAvailabilityWindow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!availability) return;
    setEnabled(availability.enabled);
    setSchedule(availability.schedule ?? []);
  }, [availability]);

  const save = useUpdateAvailability();
  const sendLocation = useUpdateAvailabilityLocation();

  const updateWindow = (index: number, patch: Partial<ISosAvailabilityWindow>) => {
    setError(null);
    setSchedule((prev) => prev.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const toggleDay = (index: number, day: number) => {
    const w = schedule[index];
    updateWindow(index, {
      days: w.days.includes(day) ? w.days.filter((d) => d !== day) : [...w.days, day].sort(),
    });
  };

  const handleSave = async () => {
    for (const w of schedule) {
      if (w.days.length === 0) {
        setError(t('Pick at least one day for each time window'));
        return;
      }
      if (!w.from || !w.to || w.from >= w.to) {
        setError(t('The end time must be after the start time'));
        return;
      }
    }
    try {
      await save.mutateAsync({ enabled, schedule });
    } catch {
      // usePost surfaces API errors.
      return;
    }
    if (enabled) {
      const p = await getCurrentPosition({ enableHighAccuracy: false, maximumAge: 10 * 60_000 });
      if (p) {
        try {
          await sendLocation.mutateAsync({ latitude: p.lat, longitude: p.lng });
          markAvailabilityLocationSent();
        } catch {
          // Retried when the app is opened again.
        }
      }
    }
  };

  const dirty =
    availability != null &&
    (availability.enabled !== enabled ||
      JSON.stringify(availability.schedule ?? []) !== JSON.stringify(schedule));

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-button-accent">
            {t('Available for SOS')}
            <InfoTooltip
              content={t(
                'While on, your approximate location (rounded to about 500 m) is used only to find SOS within 3–5 km of you. It is never shown to anyone and no history is kept. You get at most 5 SOS invites a day; medical ones are not counted.',
              )}
              contentClassName="max-w-xs"
            />
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            {t('Get invited to help when a nearby campaign sends an SOS.')}
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-12 rounded-full" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t('Available for SOS')}
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition',
              enabled ? 'bg-button-accent' : 'bg-zinc-300',
            )}
          >
            <span
              className={cn(
                'inline-block size-5 rounded-full bg-white shadow transition',
                enabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        )}
      </div>

      {enabled ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground-secondary">
            {schedule.length === 0
              ? t('Available at any time. Add time windows to limit when you are invited.')
              : t('Available only in these time windows:')}
          </p>
          {schedule.map((w, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-[rgba(136,122,71,0.3)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap gap-1">
                {WEEK_DAYS.map((d) => {
                  const active = w.days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleDay(i, d.value)}
                      className={cn(
                        'size-9 rounded-full border text-xs font-medium transition',
                        active
                          ? 'border-button-accent bg-button-accent text-white'
                          : 'border-[rgba(136,122,71,0.4)] text-foreground-secondary hover:bg-background-primary',
                      )}
                    >
                      {t(d.label)}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={w.from}
                  onChange={(e) => updateWindow(i, { from: e.target.value })}
                  className="w-28"
                  aria-label={t('From')}
                />
                <span className="text-foreground-tertiary">–</span>
                <Input
                  type="time"
                  value={w.to}
                  onChange={(e) => updateWindow(i, { to: e.target.value })}
                  className="w-28"
                  aria-label={t('To')}
                />
                <button
                  type="button"
                  onClick={() => setSchedule((prev) => prev.filter((_, j) => j !== i))}
                  className="rounded-full p-1.5 text-red-500 bg-red-100 hover:bg-red-200"
                  aria-label={t('Remove')}
                >
                  <TbTrash className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <div>
            <Button
              type="button"
              variant="outlined-brown"
              size="small"
              iconLeft={<TbPlus className="size-4" aria-hidden />}
              onClick={() => setSchedule((prev) => [...prev, { ...NEW_WINDOW }])}
            >
              {t('Add time window')}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-red-500 text-sm">{error}</p> : null}

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="brown"
          size="medium"
          isDisabled={!dirty}
          isLoading={save.isPending}
          onClick={() => void handleSave()}
        >
          {t('Save')}
        </Button>
      </div>
    </section>
  );
}
