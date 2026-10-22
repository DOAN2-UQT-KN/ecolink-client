import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { SOS_TYPE_META, SOS_TYPES } from '@/constants/sos';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useSosContext,
  type SosStateFilter,
  type SosTypeFilter,
} from '../_context/SosContext';

const SOS_STATE_OPTIONS: { labelKey: string; value: SosStateFilter }[] = [
  { labelKey: 'Open (live)', value: 'open' },
  { labelKey: 'Sent to admin', value: 'escalated' },
  { labelKey: 'Resolved', value: 'resolved' },
  { labelKey: 'Expired', value: 'expired' },
  { labelKey: 'All', value: 'all' },
];

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useSosContext();

  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchValue, 500);

  useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    const normalized = debouncedSearch.trim();
    if ((filters.search ?? '') === normalized) return;
    onFilterChange({ search: normalized });
  }, [debouncedSearch, filters.search, onFilterChange]);

  const handleTypeChange = useCallback(
    (value: string) => onFilterChange({ type: value as SosTypeFilter }),
    [onFilterChange],
  );

  const handleStateChange = useCallback(
    (value: string) => onFilterChange({ state: value as SosStateFilter }),
    [onFilterChange],
  );

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('All') },
      ...SOS_TYPES.map((type) => ({ value: type, label: t(SOS_TYPE_META[type].label) })),
    ],
    [t],
  );

  const stateOptions = useMemo(
    () => SOS_STATE_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Search')}
          </FieldLabel>
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-10 !border !border-input"
              placeholder={t('Campaign title or #ID...')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Type')}
          </FieldLabel>
          <Select value={filters.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="!h-10 w-full !border !border-input">
              <SelectValue placeholder={t('Type')} />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Status')}
          </FieldLabel>
          <Select value={filters.state} onValueChange={handleStateChange}>
            <SelectTrigger className="!h-10 w-full !border !border-input">
              <SelectValue placeholder={t('Select status')} />
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
