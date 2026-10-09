import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { cn } from '@/libs/utils';

import { useCampaign } from '../_context/CampaignContext';
import { useShiftRules } from '../_hooks/useShiftRules';
import type { CampaignDayFormValues } from '../_services/campaign.service';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

/**
 * Start – end of shift `d`.`p`; empty means the day's hour, which is what the input shows.
 * `label` names the shift ("Day 1 · Point A") for screen readers.
 */
export default function ShiftTimeWindow({
  d,
  p,
  day,
  label,
  disabled = false,
}: {
  d: number;
  p: number;
  day?: CampaignDayFormValues;
  label: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const { control, trigger } = form;
  const rules = useShiftRules();

  const timeInput = (which: 'start_time' | 'end_time') => {
    const dayTime = day?.[which] ?? '';
    return (
      <Controller
        name={`schedule.${d}.${p}.${which}`}
        control={control}
        rules={which === 'start_time' ? rules.window(d, p) : undefined}
        render={({ field }) => (
          <Input
            type="time"
            aria-label={`${label} · ${t(which === 'start_time' ? 'Shift start' : 'Shift end')}`}
            min={day?.start_time || undefined}
            max={day?.end_time || undefined}
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

  return (
    <div className="flex items-center gap-2">
      {timeInput('start_time')}
      <span className="text-muted-foreground">–</span>
      {timeInput('end_time')}
    </div>
  );
}
