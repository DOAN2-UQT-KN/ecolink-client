'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SelectListOrganization, {
  ALL_ORGANIZATIONS_VALUE,
} from '@/components/form/SelectListOrganization';
import { STATUS } from '@/constants/status';
import { useDebounce } from '@/hooks/useDebounce';
import useCampaignMeContext from '../_hooks/useCampaignMeContext';

const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: 'All', value: 'all' },
  { labelKey: 'Active', value: String(STATUS.ACTIVE) },
  { labelKey: 'Inactive', value: String(STATUS.INACTIVE) },
  { labelKey: 'Pending', value: String(STATUS.PENDING) },
  { labelKey: 'Completed', value: String(STATUS.COMPLETED) },
] as const;

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useCampaignMeContext();

  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchValue, 500);

  useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  const setUrlParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const normalized = debouncedSearch.trim();
    if ((filters.search ?? '') === normalized) return;
    setFilters({ search: normalized || undefined });
    setUrlParam('search', normalized || undefined);
  }, [debouncedSearch, filters.search, setFilters, setUrlParam]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'all' ? undefined : Number(value);
      setFilters({ status });
      setUrlParam('status', status != null ? String(status) : undefined);
    },
    [setFilters, setUrlParam],
  );

  const handleOrganizationChange = useCallback(
    (value: string) => {
      const organizationId = value === ALL_ORGANIZATIONS_VALUE ? undefined : value;
      setFilters({ organizationId: organizationId });
      setUrlParam('organizationId', organizationId);
    },
    [setFilters, setUrlParam],
  );

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
        <Field>
          <SelectListOrganization
            value={filters.organizationId || ALL_ORGANIZATIONS_VALUE}
            onChange={handleOrganizationChange}
            className="!h-10 w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50  !font-display-1"
            allOptions
          />
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
