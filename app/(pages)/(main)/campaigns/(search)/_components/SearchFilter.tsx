import { useEffect, useState } from 'react';
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
  DEFAULT_CAMPAIGN_SEARCH_STATUSES,
  isDefaultCampaignStatuses,
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

export function SearchFilter() {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useCampaignSearch();

  const urlSearch = filters.search ?? '';
  const [searchValue, setSearchValue] = useState(urlSearch);
  const debouncedSearchValue = useDebounce(searchValue, CAMPAIGN_SEARCH_DEBOUNCE_MS);

  const urlRange = normalizeGreenPointsRange(filters.greenPointsFrom, filters.greenPointsTo);
  const [greenPointsRange, setGreenPointsRange] = useState<[number, number]>(urlRange);

  // Adopt URL changes made elsewhere (reset, reload, links) — React's "adjust state on prop change".
  const urlKey = `${urlSearch}|${urlRange.join('-')}`;
  const [syncedKey, setSyncedKey] = useState(urlKey);
  if (syncedKey !== urlKey) {
    setSyncedKey(urlKey);
    if (searchValue.trim() !== urlSearch) setSearchValue(urlSearch);
    setGreenPointsRange(urlRange);
  }

  useEffect(() => {
    // Wait until typing settles; also skips the render right after the input was reset from the URL.
    if (debouncedSearchValue !== searchValue) return;
    if (debouncedSearchValue.trim() !== urlSearch) setFilters({ search: debouncedSearchValue });
  }, [debouncedSearchValue, searchValue, setFilters, urlSearch]);

  const handleStatusChange = (value: string) => {
    setFilters({ statuses: value === 'all' ? [...DEFAULT_CAMPAIGN_SEARCH_STATUSES] : [Number(value)] });
  };

  const handleGreenPointsChange = (value: number[]) => {
    if (value.length < 2) return;
    setGreenPointsRange([value[0] ?? GREEN_POINTS_MIN, value[1] ?? GREEN_POINTS_MAX]);
  };

  const handleGreenPointsCommit = (value: number[]) => {
    if (value.length < 2) return;
    setFilters({
      greenPointsFrom: value[0] ?? GREEN_POINTS_MIN,
      greenPointsTo: value[1] ?? GREEN_POINTS_MAX,
    });
  };

  const onReset = () => {
    resetFilters();
    setSearchValue('');
    setGreenPointsRange([GREEN_POINTS_MIN, GREEN_POINTS_MAX]);
  };

  const statusItems = CAMPAIGN_STATUS_OPTIONS.map((option) => ({
    value: option.value.toString(),
    label: t(option.label),
  }));

  const selectedStatusValue =
    !isDefaultCampaignStatuses(filters.statuses) && filters.statuses.length === 1
      ? (filters.statuses[0]?.toString() ?? 'all')
      : 'all';

  return (
    <aside
      className={cn(
        FILTER_PANEL_CLASS,
        'w-full lg:w-[320px] lg:sticky lg:self-start lg:top-[220px] lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto z-[40] space-y-4 h-fit',
      )}
    >
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
          <Select value={selectedStatusValue} onValueChange={handleStatusChange}>
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
    </aside>
  );
}
