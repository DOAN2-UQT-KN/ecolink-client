import type {
  IBadgeDefinition,
  IGamificationBadgeGrant,
} from '@/apis/gamification/badges/models';

// ---------------------------------------------------------------------------
// Grouped badge type
// ---------------------------------------------------------------------------

export type BadgeGrant = IGamificationBadgeGrant;

export type GroupedBadge = {
  badge: IBadgeDefinition;
  grants: BadgeGrant[];
  total: number;
  latestGrantedAt: string;
};

// ---------------------------------------------------------------------------
// Filter / sort types
// ---------------------------------------------------------------------------

export type BadgeSortOrder = 'newest' | 'oldest';

export interface BadgeFilters {
  search: string;
  category: string; // 'all' = no filter
  scope: string; // 'all' | 'LIFETIME' | 'SEASON'
  sort: BadgeSortOrder;
}

export const DEFAULT_BADGE_FILTERS: BadgeFilters = {
  search: '',
  category: 'all',
  scope: 'all',
  sort: 'newest',
};

// ---------------------------------------------------------------------------
// Transformation helpers
// ---------------------------------------------------------------------------

/**
 * Group a flat list of BadgeGrants by badge.id and compute aggregates.
 */
export function groupBadges(grants: BadgeGrant[]): GroupedBadge[] {
  const map = new Map<string, GroupedBadge>();

  for (const grant of grants) {
    const { badge } = grant;
    if (!badge?.id) continue;

    const existing = map.get(badge.id);
    if (existing) {
      existing.grants.push(grant);
      existing.total += 1;
      if (grant.grantedAt > existing.latestGrantedAt) {
        existing.latestGrantedAt = grant.grantedAt;
      }
    } else {
      map.set(badge.id, {
        badge,
        grants: [grant],
        total: 1,
        latestGrantedAt: grant.grantedAt ?? '',
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Extract unique, sorted category values from a list of grouped badges.
 */
export function extractCategories(grouped: GroupedBadge[]): string[] {
  const set = new Set<string>();
  for (const g of grouped) {
    if (g.badge.category) set.add(g.badge.category);
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Filter + sort pipeline
// ---------------------------------------------------------------------------

export function filterAndSortBadges(
  grouped: GroupedBadge[],
  filters: BadgeFilters,
): GroupedBadge[] {
  const { search, category, scope, sort } = filters;
  const normalizedSearch = search.trim().toLowerCase();

  let result = grouped;

  // Search by name
  if (normalizedSearch) {
    result = result.filter((g) =>
      g.badge.name.toLowerCase().includes(normalizedSearch),
    );
  }

  // Category filter
  if (category !== 'all') {
    result = result.filter((g) => g.badge.category === category);
  }

  // Scope filter
  if (scope !== 'all') {
    result = result.filter((g) => g.badge.scope === scope);
  }

  // Sort
  result = [...result].sort((a, b) => {
    const dateA = a.latestGrantedAt ? new Date(a.latestGrantedAt).getTime() : 0;
    const dateB = b.latestGrantedAt ? new Date(b.latestGrantedAt).getTime() : 0;
    return sort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function formatBadgeDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function getBadgeSymbolOrFallback(badge: IBadgeDefinition): string {
  return badge.symbol ?? '🏅';
}

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  ENVIRONMENTAL: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  SOCIAL: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ACHIEVEMENT: { bg: 'bg-amber-100', text: 'text-amber-700' },
  CAMPAIGN: { bg: 'bg-purple-100', text: 'text-purple-700' },
  SPECIAL: { bg: 'bg-rose-100', text: 'text-rose-700' },
  COMMUNITY: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

const FALLBACK_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700' };

export function getCategoryColor(category: string): { bg: string; text: string } {
  return CATEGORY_COLOR_MAP[category?.toUpperCase()] ?? FALLBACK_COLOR;
}

/**
 * Flatten reward object into display-friendly chips.
 * E.g. { discount: 10, tier: "Gold" } → ["10% Discount", "Gold Tier"]
 */
export function formatRewardChips(reward?: Record<string, unknown> | null): string[] {
  if (!reward || typeof reward !== 'object') return [];

  const chips: string[] = [];

  for (const [key, value] of Object.entries(reward)) {
    if (value === null || value === undefined) continue;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    chips.push(`${value} ${label}`);
  }

  return chips;
}

export function isSeasonActive(season: BadgeGrant['season']): boolean {
  return season?.status?.toLowerCase() === 'active';
}
