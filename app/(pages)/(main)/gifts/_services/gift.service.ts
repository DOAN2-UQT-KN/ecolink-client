import type { IGetGiftsRequest } from "@/apis/gift/models/gift";

export const GIFT_PAGE_SIZE = 12;
export const GIFT_SEARCH_DEBOUNCE_MS = 500;
export const GIFT_POINTS_MIN = 0;
export const GIFT_POINTS_MAX = 5000;

export type GiftStockFilter = "all" | "in_stock";
export type GiftSortBy = "name_asc" | "name_desc" | "points_asc" | "points_desc";

export type GiftFilters = {
  search: string;
  inStock: GiftStockFilter;
  sortBy: GiftSortBy;
  pointsRange: [number, number];
};

export function parseStockFilter(value: string | undefined): GiftStockFilter {
  return value === "in_stock" ? "in_stock" : "all";
}

export function parseSortBy(value: string | undefined): GiftSortBy {
  if (value === "name_asc" || value === "name_desc" || value === "points_asc" || value === "points_desc") {
    return value;
  }
  return "points_asc";
}

export function parsePoint(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < GIFT_POINTS_MIN) return fallback;
  return Math.floor(parsed);
}

export function normalizePointsRange(min?: number, max?: number): [number, number] {
  const normalizedMin = Math.min(Math.max(min ?? GIFT_POINTS_MIN, GIFT_POINTS_MIN), GIFT_POINTS_MAX);
  const normalizedMax = Math.min(Math.max(max ?? GIFT_POINTS_MAX, GIFT_POINTS_MIN), GIFT_POINTS_MAX);
  return normalizedMin <= normalizedMax
    ? [normalizedMin, normalizedMax]
    : [normalizedMax, normalizedMin];
}

export function buildGiftFilters(initial: {
  search?: string;
  inStock?: string;
  sortBy?: string;
  pointsMin?: string;
  pointsMax?: string;
}): GiftFilters {
  return {
    search: initial.search ?? "",
    inStock: parseStockFilter(initial.inStock),
    sortBy: parseSortBy(initial.sortBy),
    pointsRange: normalizePointsRange(
      parsePoint(initial.pointsMin, GIFT_POINTS_MIN),
      parsePoint(initial.pointsMax, GIFT_POINTS_MAX),
    ),
  };
}

export function buildGiftRequest(
  filters: GiftFilters,
  pagination: { current: number; pageSize: number },
): IGetGiftsRequest {
  return {
    page: pagination.current,
    limit: pagination.pageSize,
    search: filters.search.trim() || undefined,
    inStock: filters.inStock === "in_stock" ? true : undefined,
    greenPointsMin: filters.pointsRange[0],
    greenPointsMax: filters.pointsRange[1],
  };
}
