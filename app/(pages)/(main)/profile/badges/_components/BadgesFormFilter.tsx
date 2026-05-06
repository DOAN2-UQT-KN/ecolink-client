'use client';

import { memo, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import useBadgesContext from '../_hooks/useBadgesContext';
import type { BadgeSortOrder } from '../_services/badges.service';

const SCOPE_OPTIONS = [
  { value: 'all', label: 'All scopes' },
  { value: 'LIFETIME', label: 'Lifetime' },
  { value: 'SEASON', label: 'Seasonal' },
];

const SORT_OPTIONS: { value: BadgeSortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const BadgesFormFilter = memo(function BadgesFormFilter() {
  const { t } = useTranslation();
  const { filters, categories, setSearch, setCategory, setScope, setSort } = useBadgesContext();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [setSearch],
  );

  const categoryOptions = [
    { value: 'all', label: t('All categories') },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <section className="rounded-[15px] border border-[rgba(136,122,71,0.4)] bg-background p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative w-[230px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder={t('Search badges…')}
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1"
          />
        </div>

        {/* Category */}
        <Select value={filters.category} onValueChange={setCategory}>
          <SelectTrigger className="w-full !h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1">
            <SelectValue placeholder={t('All categories')} />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Scope */}
        <Select value={filters.scope} onValueChange={setScope}>
          <SelectTrigger className="w-full !h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1">
            <SelectValue placeholder={t('All scopes')} />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sort} onValueChange={(v) => setSort(v as BadgeSortOrder)}>
          <SelectTrigger className="w-full !h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1">
            <SelectValue placeholder={t('Sort')} />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
});

export default BadgesFormFilter;
