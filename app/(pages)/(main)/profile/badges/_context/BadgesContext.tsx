'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useGetMyGamificationBadges } from '@/apis/gamification/badges/list';

import {
  DEFAULT_BADGE_FILTERS,
  type BadgeFilters,
  type BadgeSortOrder,
  type GroupedBadge,
  extractCategories,
  filterAndSortBadges,
  groupBadges,
} from '../_services/badges.service';

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

export interface BadgesContextType {
  allGrouped: GroupedBadge[];
  filtered: GroupedBadge[];
  categories: string[];
  filters: BadgeFilters;
  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setScope: (scope: string) => void;
  setSort: (sort: BadgeSortOrder) => void;
  isLoading: boolean;
  expandedIds: Set<string>;
  toggleExpanded: (badgeId: string) => void;
}

export const BadgesContext = createContext<BadgesContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function BadgesProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<BadgeFilters>(DEFAULT_BADGE_FILTERS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const badgesQuery = useGetMyGamificationBadges({});

  const allGrouped = useMemo<GroupedBadge[]>(() => {
    const grants = badgesQuery.data?.data?.badges ?? [];
    return groupBadges(grants);
  }, [badgesQuery.data?.data?.badges]);

  const categories = useMemo<string[]>(() => extractCategories(allGrouped), [allGrouped]);

  const filtered = useMemo<GroupedBadge[]>(
    () => filterAndSortBadges(allGrouped, filters),
    [allGrouped, filters],
  );

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const setScope = useCallback((scope: string) => {
    setFilters((prev) => ({ ...prev, scope }));
  }, []);

  const setSort = useCallback((sort: BadgeSortOrder) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  const toggleExpanded = useCallback((badgeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(badgeId)) {
        next.delete(badgeId);
      } else {
        next.add(badgeId);
      }
      return next;
    });
  }, []);

  const contextValue = useMemo<BadgesContextType>(
    () => ({
      allGrouped,
      filtered,
      categories,
      filters,
      setSearch,
      setCategory,
      setScope,
      setSort,
      isLoading: badgesQuery.isLoading,
      expandedIds,
      toggleExpanded,
    }),
    [
      allGrouped,
      filtered,
      categories,
      filters,
      setSearch,
      setCategory,
      setScope,
      setSort,
      badgesQuery.isLoading,
      expandedIds,
      toggleExpanded,
    ],
  );

  return <BadgesContext.Provider value={contextValue}>{children}</BadgesContext.Provider>;
}
