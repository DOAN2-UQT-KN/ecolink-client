'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetMetricColumns, useGetMetricTables } from '@/apis/gamification';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

/** Sentinel for Radix Select when no column is chosen (`value` is ''). */
export const METRIC_COLUMN_NONE_VALUE = '__metric_column_none__';

interface SelectListMetricColumnsProps {
  /** Logical metric table key (`RuleLeaf.target`); columns load after this resolves to a table id. */
  tableKey?: string;
  value?: string;
  onChange: (columnKey: string) => void;
  disabled?: boolean;
  className?: string;
}

const SelectListMetricColumns = memo(function SelectListMetricColumns({
  tableKey = '',
  value = '',
  onChange,
  disabled = false,
  className,
  ...rest
}: SelectListMetricColumnsProps) {
  const { t } = useTranslation();

  const { data: tablesData, isLoading: tablesLoading } = useGetMetricTables(
    {},
    {
      staleTime: 60_000,
    },
  );

  const tables = useMemo(() => tablesData?.data?.tables ?? [], [tablesData?.data?.tables]);

  const metricTableId = useMemo(
    () => (tableKey ? tables.find((tbl) => tbl.key === tableKey)?.id : undefined),
    [tables, tableKey],
  );

  const { data: columnsData, isLoading: columnsLoading } = useGetMetricColumns(
    { metricTableId: metricTableId ?? '' },
    { enabled: Boolean(metricTableId), staleTime: 60_000 },
  );

  const columns = useMemo(() => columnsData?.data?.columns ?? [], [columnsData?.data?.columns]);

  const fieldItems = useMemo(() => {
    const base = columns.map((c) => ({ key: c.key, label: c.label }));
    if (value && !base.some((b) => b.key === value)) {
      return [{ key: value, label: value }, ...base];
    }
    return base;
  }, [columns, value]);

  const selectedColumn = useMemo(
    () => (value ? fieldItems.find((c) => c.key === value) : undefined),
    [fieldItems, value],
  );

  const selectValue = value === '' ? METRIC_COLUMN_NONE_VALUE : value;

  const handleChange = (v: string) => {
    onChange(v === METRIC_COLUMN_NONE_VALUE ? '' : v);
  };

  const unknownTableAfterLoad =
    Boolean(tableKey) && !tablesLoading && tables.length > 0 && !metricTableId;

  if (!tableKey) {
    return (
      <div
        role="status"
        aria-label={t('Select table first')}
        className={cn(
          'flex h-9 w-full items-center rounded-md border border-zinc-300 bg-muted/40 px-3 text-xs text-muted-foreground dark:border-zinc-600',
          className,
        )}
        {...rest}
      >
        {t('Select field')}
      </div>
    );
  }

  if (tablesLoading || (Boolean(metricTableId) && columnsLoading)) {
    return <Skeleton className="h-9 w-full rounded-md" />;
  }

  return (
    <Select
      value={selectValue}
      onValueChange={handleChange}
      disabled={disabled || unknownTableAfterLoad}
    >
      <SelectTrigger
        className={cn('!h-9 w-full text-xs !border-zinc-300 dark:!border-zinc-600', className)}
        {...rest}
      >
        <SelectValue placeholder={t('Select field')}>
          {selectedColumn ? (
            <span className="text-xs font-mono">{selectedColumn.label}</span>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={METRIC_COLUMN_NONE_VALUE} className="text-xs text-muted-foreground">
          {t('Select field')}
        </SelectItem>
        {fieldItems.map((col, idx) => (
          <SelectItem key={`${col.key}-${idx}`} value={col.key} className="text-xs font-mono">
            {col.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default SelectListMetricColumns;
