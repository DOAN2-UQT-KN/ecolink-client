import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";

import type { BadgeAdminFilterValues } from "../_context/BadgeAdminContext";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function normalizeBadgePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? limit
    : 10;
}

export function filterBadges(
  badges: IAdminBadgeDefinition[],
  filters: BadgeAdminFilterValues,
): IAdminBadgeDefinition[] {
  const q = filters.search.trim().toLowerCase();
  if (!q) return badges;

  return badges.filter((b) => {
    const sym = b.symbol?.toLowerCase() ?? "";
    return (
      b.slug.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      sym.includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  });
}

export function paginateBadges(
  badges: IAdminBadgeDefinition[],
  current: number,
  pageSize: number,
): IAdminBadgeDefinition[] {
  const start = (current - 1) * pageSize;
  return badges.slice(start, start + pageSize);
}
