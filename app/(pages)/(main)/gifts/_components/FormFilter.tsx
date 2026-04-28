'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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

import { useGiftContext } from '../_hooks/useGiftContext';
import {
  GIFT_POINTS_MAX,
  GIFT_POINTS_MIN,
  GIFT_SEARCH_DEBOUNCE_MS,
  normalizePointsRange,
  type GiftSortBy,
  type GiftStockFilter,
} from '../_services/gift.service';

const FILTER_PANEL_CLASS =
  'w-full rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white/80 p-6 shadow-sm ring-1 ring-white/5';

const FILTER_CONTROL_H = '!h-11';

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

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useGiftContext();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [pointsRange, setPointsRange] = useState<[number, number]>(
    normalizePointsRange(filters.pointsRange[0], filters.pointsRange[1]),
  );

  const debouncedSearchValue = useDebounce(searchValue, GIFT_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setPointsRange(normalizePointsRange(filters.pointsRange[0], filters.pointsRange[1]));
  }, [filters.pointsRange]);

  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters({ search: debouncedSearchValue });
    }
  }, [debouncedSearchValue, filters.search, setFilters]);

  const handleStockChange = useCallback(
    (value: string) => {
      setFilters({ inStock: value as GiftStockFilter });
    },
    [setFilters],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setFilters({ sortBy: value as GiftSortBy });
    },
    [setFilters],
  );

  const handlePointsRangeChange = useCallback((value: number[]) => {
    if (value.length < 2) return;
    setPointsRange(normalizePointsRange(value[0], value[1]));
  }, []);

  const handlePointsRangeCommit = useCallback(
    (value: number[]) => {
      if (value.length < 2) return;
      setFilters({ pointsRange: normalizePointsRange(value[0], value[1]) });
    },
    [setFilters],
  );

  const onReset = useCallback(() => {
    setSearchValue('');
    setPointsRange([GIFT_POINTS_MIN, GIFT_POINTS_MAX]);
    resetFilters();
  }, [resetFilters]);

  const sortItems = useMemo(
    () => [
      { value: 'points_asc', label: t('Points: Low to high') },
      { value: 'points_desc', label: t('Points: High to low') },
      { value: 'name_asc', label: t('Name: A to Z') },
      { value: 'name_desc', label: t('Name: Z to A') },
    ],
    [t],
  );

  return (
    <div className={FILTER_PANEL_CLASS}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Search')}</FieldLabel>
          <div className="relative group">
            <TbZoom className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              className={SEARCH_INPUT_CLASS}
              placeholder={t('Gift name')}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </Field>

        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Stock')}</FieldLabel>
          <Select value={filters.inStock} onValueChange={handleStockChange}>
            <SelectTrigger className={FILTER_SELECT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All')}</SelectItem>
              <SelectItem value="in_stock">{t('In stock only')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Sort')}</FieldLabel>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className={FILTER_SELECT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field className="w-full">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Green points')}
          </FieldLabel>
          <div className="rounded-md border border-[rgba(136,122,71,0.5)] bg-white/50 px-4 py-3">
            <Slider
              min={GIFT_POINTS_MIN}
              max={GIFT_POINTS_MAX}
              step={10}
              value={pointsRange}
              onValueChange={handlePointsRangeChange}
              onValueCommit={handlePointsRangeCommit}
              className="[&_[data-slot=slider-range]]:bg-button-accent [&_[data-slot=slider-thumb]]:border-button-accent"
              aria-label={t('Green points range')}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{pointsRange[0]}</span>
              <span>{pointsRange[1]}</span>
            </div>
          </div>
        </Field>
      </div>

      {/* <div className="mt-4 flex justify-end">
        <Button type="button" variant="outlined-brown" className={RESET_BUTTON_CLASS} onClick={onReset}>
          <span className="flex items-center justify-center gap-2">
            <TbZoomReset size={16} />
            {t("Reset")}
          </span>
        </Button>
      </div> */}
    </div>
  );
});
