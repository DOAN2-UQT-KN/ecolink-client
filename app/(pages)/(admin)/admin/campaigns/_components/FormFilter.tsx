import { memo, useEffect, useState } from 'react';
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
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import { useDebounce } from '@/hooks/useDebounce';
import { useCampaignContext } from '../_context/CampaignContext';

/** Campaign statuses an admin can filter by (drafts are private to their managers). */
const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: 'All', value: 'all' },
  { labelKey: 'Pending review', value: String(CAMPAIGN_STATUS.PENDING_REVIEW) },
  { labelKey: 'Needs revision', value: String(CAMPAIGN_STATUS.NEEDS_REVISION) },
  { labelKey: 'Upcoming', value: String(CAMPAIGN_STATUS.UPCOMING) },
  { labelKey: 'Active', value: String(CAMPAIGN_STATUS.ACTIVE) },
  { labelKey: 'Waiting Confirmed', value: String(CAMPAIGN_STATUS.PENDING_COMPLETION) },
  { labelKey: 'Completed', value: String(CAMPAIGN_STATUS.COMPLETED) },
  { labelKey: 'Rejected', value: String(CAMPAIGN_STATUS.BLOCKED) },
  { labelKey: 'Expired', value: String(CAMPAIGN_STATUS.EXPIRED) },
  { labelKey: 'Cancelled', value: String(CAMPAIGN_STATUS.CANCELLED) },
] as const;

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useCampaignContext();

  const urlSearch = filters.search ?? '';
  const [searchValue, setSearchValue] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchValue, 500);

  // Adopt a search that changed in the URL from elsewhere (React's "adjust state on prop change").
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  if (syncedSearch !== urlSearch) {
    setSyncedSearch(urlSearch);
    if (searchValue.trim() !== urlSearch) setSearchValue(urlSearch);
  }

  useEffect(() => {
    // Wait until typing settles; also skips the render right after the input was reset from the URL.
    if (debouncedSearch !== searchValue) return;
    const normalized = debouncedSearch.trim();
    if (normalized !== urlSearch) onFilterChange({ search: normalized });
  }, [debouncedSearch, onFilterChange, searchValue, urlSearch]);

  const handleStatusChange = (value: string) => onFilterChange({ status: value });

  // treat the "-1" sentinel ("All") as no filter
  const handleOrganizationChange = (value: string) =>
    onFilterChange({ organizationId: value === ALL_ORGANIZATIONS_VALUE ? '' : value });

  const statusOptions = CAMPAIGN_STATUS_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) }));

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
