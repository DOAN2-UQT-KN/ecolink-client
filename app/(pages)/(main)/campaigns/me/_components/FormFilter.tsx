import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SelectListOrganization, {
  ALL_ORGANIZATIONS_VALUE,
} from '@/components/form/SelectListOrganization';
import { ALL_ORG_MEMBER_ROLES } from '@/hooks/useCampaignCreatorOrganizations';
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import { useDebounce } from '@/hooks/useDebounce';
import { useCampaignMeContext } from '../_context/CampaignMeContext';

const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: 'All', value: 'all' },
  { labelKey: 'Draft', value: String(CAMPAIGN_STATUS.DRAFT) },
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
  const { filters, setFilters } = useCampaignMeContext();

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
    if (normalized !== urlSearch) setFilters({ search: normalized });
  }, [debouncedSearch, searchValue, setFilters, urlSearch]);

  const handleStatusChange = (value: string) => {
    setFilters({ status: value === 'all' ? undefined : Number(value) });
  };

  // Keeps "-1" in the URL for an explicit "All" so the active-org default does not re-apply.
  const handleOrganizationChange = (value: string) => {
    setFilters({ organizationId: value });
  };

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={filters.status != null ? String(filters.status) : 'all'}
          onValueChange={handleStatusChange}
          className="w-full lg:w-auto"
        >
          <TabsList className="bg-[#887A47]/10 border-none h-12 rounded-[5px] w-full lg:w-auto overflow-x-auto overflow-y-hidden no-scrollbar gap-3">
            {CAMPAIGN_STATUS_OPTIONS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
              >
                {t(item.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-[300px] group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('Search by title...')}
            className="pl-10 h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1"
          />
        </div>
        <Field className="w-full lg:w-[300px]">
          <SelectListOrganization
            value={filters.organizationId || ALL_ORGANIZATIONS_VALUE}
            onChange={handleOrganizationChange}
            className="!h-10 w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50  !font-display-1"
            allOptions
            roles={ALL_ORG_MEMBER_ROLES}
          />
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
