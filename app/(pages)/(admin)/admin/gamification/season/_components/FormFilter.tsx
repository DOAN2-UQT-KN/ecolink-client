'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbZoom } from 'react-icons/tb';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { useSeasonContext } from '../_hooks/useSeasonContext';

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useSeasonContext();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== filters.search) {
      onFilterChange({ search: next });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const fields = useMemo(
    () => [
      {
        key: 'kind',
        label: t('Kind'),
        render: () => (
          <Select
            value={filters.kind || 'ALL'}
            onValueChange={(value) =>
              onFilterChange({
                kind: value === 'ALL' ? '' : (value as 'MONTHLY' | 'QUARTERLY'),
              })
            }
          >
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder={t('Select kind')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('All')}</SelectItem>
              <SelectItem value="MONTHLY">{t('Monthly')}</SelectItem>
              <SelectItem value="QUARTERLY">{t('Quarterly')}</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: 'search',
        label: t('Search'),
        render: () => (
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="!h-10 !border !border-zinc-300 pl-10"
              placeholder={t('Search by season name...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
    ],
    [filters.kind, onFilterChange, searchInput, t],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <Field key={field.key}>
            <FieldLabel className="text-sm font-medium text-foreground-secondary">
              {field.label}
            </FieldLabel>
            {field.render()}
          </Field>
        ))}
      </div>
    </div>
  );
}
