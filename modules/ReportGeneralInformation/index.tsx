import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/libs/utils';
import { getSeverityLevel } from '@/constants/severity';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';

const WASTE_TYPE_LABELS: Record<string, string> = {
  household: 'Household waste',
  construction: 'Construction waste',
  industrial: 'Industrial waste',
  hazardous: 'Hazardous waste',
};

const CONDITION_LABELS: Record<string, string> = {
  'newly-appeared': 'Newly-appeared',
  'long-standing': 'Long-standing',
  reappeared: 'Previously cleaned but reappeared',
};

const CELL_MAX_LENGTH = 28;

export function getWasteTypeLabels(
  value: string | null | undefined,
  t: (key: string) => string,
): string[] {
  const tokens = (value || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  return tokens.map((token) => t(WASTE_TYPE_LABELS[token] || token));
}

interface FieldCellProps {
  isDark?: boolean;
}

export const SeverityCell = memo(function SeverityCell({
  value,
  isDark = false,
}: FieldCellProps & { value?: string | number | null }) {
  const { t } = useTranslation();
  const severity = getSeverityLevel(value);
  return (
    <TooltipTruncatedText
      text={severity ? t(severity.label) : t('N/A')}
      maxLength={CELL_MAX_LENGTH}
      className={cn(
        'text-xs font-medium',
        severity?.textClass || (isDark ? 'text-zinc-200' : 'text-foreground'),
      )}
    />
  );
});

export const ConditionCell = memo(function ConditionCell({
  value,
  isDark = false,
}: FieldCellProps & { value?: string | null }) {
  const { t } = useTranslation();
  const label = value ? t(CONDITION_LABELS[value] || value) : t('N/A');
  return (
    <TooltipTruncatedText
      text={label}
      maxLength={CELL_MAX_LENGTH}
      className={cn(
        'text-xs font-medium',
        isDark ? 'text-zinc-200' : 'text-foreground',
      )}
    />
  );
});

export const WasteTypeCell = memo(function WasteTypeCell({
  value,
  isDark = false,
}: FieldCellProps & { value?: string | null }) {
  const { t } = useTranslation();
  const labels = useMemo(() => getWasteTypeLabels(value, t), [t, value]);
  const textClass = cn(
    'text-xs font-medium',
    isDark ? 'text-zinc-200' : 'text-foreground',
  );

  if (labels.length === 0) {
    return (
      <TooltipTruncatedText
        text={t('N/A')}
        maxLength={CELL_MAX_LENGTH}
        className={textClass}
      />
    );
  }

  return (
    <span className="flex w-full min-w-0 flex-col gap-0.5">
      {labels.map((label) => (
        <TooltipTruncatedText
          key={label}
          text={label}
          maxLength={CELL_MAX_LENGTH}
          className={textClass}
        />
      ))}
    </span>
  );
});
