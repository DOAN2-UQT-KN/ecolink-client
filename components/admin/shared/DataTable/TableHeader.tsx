import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableHead, TableHeader as BaseTableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/libs/utils';
import type { DataTableColumn, SortOrder } from './types';
import { useTranslation } from 'react-i18next';

type Props<T> = {
  columns: DataTableColumn<T>[];
  showSelection: boolean;
  allSelected: boolean;
  partiallySelected: boolean;
  canSelectAny: boolean;
  sortKey?: string | null;
  sortOrder?: SortOrder;
  onToggleAll: (checked: boolean) => void;
  onSortChange?: (key: string, order: SortOrder) => void;
  stickyHeader?: boolean;
  theme?: 'light' | 'dark';
};

export function DataTableHeader<T>({
  columns,
  showSelection,
  allSelected,
  partiallySelected,
  canSelectAny,
  sortKey,
  sortOrder,
  onToggleAll,
  onSortChange,
  stickyHeader,
}: Props<T>) {
  const { t } = useTranslation();
  return (
    <BaseTableHeader
      className={cn(
        stickyHeader && 'sticky top-0 z-10 backdrop-blur-sm bg-zinc-100 border-b border-gray-200',
      )}
    >
      <TableRow className="bg-zinc-200 hover:bg-zinc-200 border-b border-gray-200">
        {showSelection && (
          <TableHead className="w-12 px-3">
            <Checkbox
              checked={allSelected || (partiallySelected ? 'indeterminate' : false)}
              disabled={!canSelectAny}
              onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
              aria-label={t('Select all rows')}
            />
          </TableHead>
        )}
        {columns.map((column) => {
          const active = sortKey === column.key;
          const nextOrder: SortOrder = !active
            ? 'asc'
            : sortOrder === 'asc'
              ? 'desc'
              : sortOrder === 'desc'
                ? null
                : 'asc';

          return (
            <TableHead
              key={column.key}
              className={cn(
                'px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-zinc-700',
                column.sticky === 'left' && 'sticky left-0 z-20',
                column.sticky === 'right' && 'sticky right-0 z-20',
                column.sticky && 'bg-zinc-200',
                column.className,
              )}
              style={{ width: column.width }}
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => onSortChange?.(column.key, nextOrder)}
                  className="inline-flex items-center gap-1 transition-colors cursor-pointer text-black"
                >
                  {column.title}
                  {active ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : sortOrder === 'desc' ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-black" />
                  )}
                </button>
              ) : (
                column.title
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </BaseTableHeader>
  );
}
