import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/client/shared/Button';
import { Input } from '@/components/ui/input';
import type { QuantityLimitReason } from '../_services/redeemForm.service';

type Props = {
  id: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  max: number;
  reason: QuantityLimitReason;
  disabled?: boolean;
  invalid?: boolean;
  /** Ids of the hint and error lines this field is described by. */
  describedBy?: string;
};

const STEP_CLASS = '!h-11 !w-11 !min-w-0 !px-0';

/** − / number / + for how many items to order; typed values are clamped to 1..max on blur. */
export function QuantityField({ id, value, onChange, onBlur, max, reason, disabled, invalid, describedBy }: Props) {
  const { t } = useTranslation();
  const clamp = (n: number) => Math.min(max, Math.max(1, Math.trunc(n) || 1));
  const atMax = value >= max;
  const hintId = `${id}-limit`;
  const hint = !atMax
    ? null
    : reason === 'stock'
      ? max === 1
        ? t('Only 1 left in stock')
        : t('Only {{count}} left in stock', { count: max })
      : reason === 'points'
        ? t('Not enough points for more')
        : t('At most {{max}} per order', { max });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant="outlined-brown"
          size="medium"
          className={STEP_CLASS}
          aria-label={t('Decrease quantity')}
          aria-controls={id}
          isDisabled={disabled || value <= 1}
          onClick={() => onChange(clamp(value - 1))}
        >
          <Minus className="size-4" aria-hidden />
        </Button>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          className="!h-11 w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={[hint ? hintId : null, describedBy].filter(Boolean).join(' ') || undefined}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          onBlur={() => {
            onChange(clamp(value));
            onBlur?.();
          }}
        />
        <Button
          variant="outlined-brown"
          size="medium"
          className={STEP_CLASS}
          aria-label={t('Increase quantity')}
          aria-controls={id}
          isDisabled={disabled || atMax}
          onClick={() => onChange(clamp(value + 1))}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-foreground-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
