'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetMetricTables } from '@/apis/gamification';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

/** Sentinel for Radix Select when no logical table is chosen (`value` is ''). */
export const METRIC_TABLE_NONE_VALUE = '__metric_table_none__';

interface SelectListMetricTablesProps {
  value?: string;
  onChange: (tableKey: string) => void;
  disabled?: boolean;
  className?: string;
}

const SelectListMetricTables = memo(function SelectListMetricTables({
  value = '',
  onChange,
  disabled = false,
  className,
  ...rest
}: SelectListMetricTablesProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useGetMetricTables({}, { staleTime: 60_000 });

  const tables = useMemo(() => data?.data?.tables ?? [], [data?.data?.tables]);

  const selectedTable = useMemo(
    () => (value ? tables.find((tbl) => tbl.key === value) : undefined),
    [tables, value],
  );

  const selectValue = value === '' ? METRIC_TABLE_NONE_VALUE : value;

  const handleChange = (v: string) => {
    onChange(v === METRIC_TABLE_NONE_VALUE ? '' : v);
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-md" />;
  }

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          '!h-9 w-full text-xs !border-zinc-300 dark:!border-zinc-600',
          className,
        )}
        {...rest}
      >
        <SelectValue placeholder={t('Select table')}>
          {selectedTable ? (
            <span className="text-xs">{selectedTable.label}</span>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={METRIC_TABLE_NONE_VALUE} className="text-xs text-muted-foreground">
          {t('Select table')}
        </SelectItem>
        {tables.map((tbl) => (
          <SelectItem key={tbl.id} value={tbl.key} className="text-xs">
            {tbl.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default SelectListMetricTables;
