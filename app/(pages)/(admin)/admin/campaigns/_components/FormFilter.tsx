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
import SelectListOrganization, {
  ALL_ORGANIZATIONS_VALUE,
} from '@/components/form/SelectListOrganization';
import { STATUS } from '@/constants/status';
import { useDebounce } from '@/hooks/useDebounce';
import { useCampaignContext } from '../_context/CampaignContext';

/** Status options relevant to campaigns — derived from STATUS enum */
const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: 'All', value: 'all' },
  { labelKey: 'Active', value: String(STATUS.ACTIVE) },
  { labelKey: 'Inactive', value: String(STATUS.INACTIVE) },
  { labelKey: 'Pending', value: String(STATUS.PENDING) },
  // { labelKey: "Verified", value: String(STATUS.VERIFIED) },
  // { labelKey: "Rejected", value: String(STATUS.REJECTED) },
  { labelKey: 'Completed', value: String(STATUS.COMPLETED) },
] as const;

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useCampaignContext();

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

  const handleStatusChange = useCallback(
    (value: string) => {
      onFilterChange({ status: value });
    },
    [onFilterChange],
  );

  const handleOrganizationChange = useCallback(
    (value: string) => {
      // treat the "-1" sentinel ("All") as no filter
      onFilterChange({ organizationId: value === ALL_ORGANIZATIONS_VALUE ? '' : value });
    },
    [onFilterChange],
  );

  const statusOptions = useMemo(
    () => CAMPAIGN_STATUS_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
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
              placeholder={t('Search by title...')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Status')}
          </FieldLabel>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="!h-10 w-full !border !border-input">
              <SelectValue placeholder={t('Select status')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Organization')}
          </FieldLabel>
          <SelectListOrganization
            value={filters.organizationId || ALL_ORGANIZATIONS_VALUE}
            onChange={handleOrganizationChange}
            className="!h-10 !border !border-input"
            allOptions
          />
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
