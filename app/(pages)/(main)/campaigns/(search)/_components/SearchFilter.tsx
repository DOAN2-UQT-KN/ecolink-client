'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TbZoom, TbZoomReset } from 'react-icons/tb';

import { Button } from '@/components/client/shared/Button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/libs/utils';

import {
  CAMPAIGN_SEARCH_DEBOUNCE_MS,
  CAMPAIGN_STATUS_OPTIONS,
} from '../_services/campaignSearch.service';
import { useCampaignSearch } from '../_context/CampaignSearchContext';

const FILTER_PANEL_CLASS =
  'w-full  p-6 border border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 h-fit';

const FILTER_CONTROL_H = '!h-11';
const GREEN_POINTS_MIN = 0;
const GREEN_POINTS_MAX = 100;

const normalizeGreenPointsRange = (from?: number, to?: number): [number, number] => {
  const normalizedFrom = Math.min(Math.max(from ?? GREEN_POINTS_MIN, GREEN_POINTS_MIN), GREEN_POINTS_MAX);
  const normalizedTo = Math.min(Math.max(to ?? GREEN_POINTS_MAX, GREEN_POINTS_MIN), GREEN_POINTS_MAX);

  return normalizedFrom <= normalizedTo
    ? [normalizedFrom, normalizedTo]
    : [normalizedTo, normalizedFrom];
};

const SEARCH_INPUT_CLASS = cn(
  'pl-10 border border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 focus-visible:bg-white transition-all',
  FILTER_CONTROL_H,
);

const FILTER_SELECT_CLASS = cn(
  'w-full border border-[rgba(136,122,71,0.5)] focus-visible:ring-2 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50',
  FILTER_CONTROL_H,
);

const RESET_BUTTON_CLASS = cn(
  'w-full lg:w-auto border-dashed border-2 hover:border-primary hover:text-primary transition-all gap-2 shrink-0',
  FILTER_CONTROL_H,
);

interface SearchFilterProps {
  isScrolled?: boolean;
}

export const SearchFilter = memo(function SearchFilter({ isScrolled = false }: SearchFilterProps) {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useCampaignSearch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [greenPointsRange, setGreenPointsRange] = useState<[number, number]>(
    normalizeGreenPointsRange(filters.greenPointsFrom, filters.greenPointsTo),
  );

  const debouncedSearchValue = useDebounce(searchValue, CAMPAIGN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters({ search: debouncedSearchValue });
      updateURL({ search: debouncedSearchValue || undefined });
    }
  }, [debouncedSearchValue, filters.search, setFilters, updateURL]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'all' ? undefined : Number(value);
      setFilters({ status });
      updateURL({ status: status?.toString() });
    },
    [setFilters, updateURL],
  );

  useEffect(() => {
    setGreenPointsRange(normalizeGreenPointsRange(filters.greenPointsFrom, filters.greenPointsTo));
  }, [filters.greenPointsFrom, filters.greenPointsTo]);

  const handleGreenPointsChange = useCallback((value: number[]) => {
    if (value.length < 2) return;
    setGreenPointsRange([value[0] ?? GREEN_POINTS_MIN, value[1] ?? GREEN_POINTS_MAX]);
  }, []);

  const handleGreenPointsCommit = useCallback(
    (value: number[]) => {
      if (value.length < 2) return;

      const greenPointsFrom = value[0] ?? GREEN_POINTS_MIN;
      const greenPointsTo = value[1] ?? GREEN_POINTS_MAX;

      setFilters({ greenPointsFrom, greenPointsTo });
      updateURL({
        green_points_from: greenPointsFrom.toString(),
        green_points_to: greenPointsTo.toString(),
      });
    },
    [setFilters, updateURL],
  );

  const onReset = useCallback(() => {
    resetFilters();
    setSearchValue('');
    setGreenPointsRange([GREEN_POINTS_MIN, GREEN_POINTS_MAX]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('status');
    params.delete('green_points_from');
    params.delete('green_points_to');

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, resetFilters, router, searchParams]);

  const statusItems = useMemo(
    () =>
      CAMPAIGN_STATUS_OPTIONS.map((option) => ({
        value: option.value.toString(),
        label: t(option.label),
      })),
    [t],
  );

  return (
    <aside
      className={cn(
        'w-full lg:w-[320px] sticky top-0 z-[40] h-full transition-all duration-200',
        isScrolled ? 'pt-[100px]' : 'pt-0',
      )}
    >
      <div className={cn(FILTER_PANEL_CLASS, 'space-y-4')}>
        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Search')}</FieldLabel>
          <div className="relative group">
            <TbZoom className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              className={SEARCH_INPUT_CLASS}
              placeholder={t('Campaign name')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </Field>

        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full"> */}
        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Green points')}
          </FieldLabel>
          <div className="rounded-md border border-[rgba(136,122,71,0.5)] bg-white/50 px-4 py-3 w-full">
            <Slider
              min={GREEN_POINTS_MIN}
              max={GREEN_POINTS_MAX}
              step={1}
              value={greenPointsRange}
              onValueChange={handleGreenPointsChange}
              onValueCommit={handleGreenPointsCommit}
              aria-label={t('Green points')}
              className="[&_[data-slot=slider-range]]:bg-button-accent [&_[data-slot=slider-thumb]]:border-button-accent"
            />
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{greenPointsRange[0]}</span>
              <span>{greenPointsRange[1]}</span>
            </div>
          </div>
        </Field>
        {/* </div> */}

        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Status')}</FieldLabel>
          <Select value={filters.status?.toString() || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className={FILTER_SELECT_CLASS}>
              <SelectValue placeholder={t('All statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All statuses')}</SelectItem>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Button
          type="button"
          variant="outlined-brown"
          className={RESET_BUTTON_CLASS}
          onClick={onReset}
        >
          <span className="flex flex-row items-center justify-center gap-2">
            <TbZoomReset size={16} />
            {t('Reset')}
          </span>
        </Button>
      </div>
    </aside>
  );
});
