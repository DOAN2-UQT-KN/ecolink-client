import type { ICategorySuggestion } from "@/apis/incident/models/context";
import type { ReportCategory } from "@/apis/incident/models/verification";

export interface OrderedCategory {
  value: ReportCategory;
  label: string;
  hint?: { name: string | null; distanceM: number | null };
}

/**
 * Categories that fit the pinned point first (server order, nearest first), the rest in default
 * order. Unknown or repeated suggestions are dropped; no suggestions = the default list.
 */
export function orderCategories(
  all: { value: ReportCategory; label: string }[],
  suggestions: ICategorySuggestion[] | undefined,
): OrderedCategory[] {
  if (!suggestions?.length) return all;
  const byValue = new Map(all.map((c) => [c.value, c]));
  const suggested: OrderedCategory[] = [];
  for (const s of suggestions) {
    const category = byValue.get(s.category);
    if (!category || suggested.some((c) => c.value === s.category)) continue;
    suggested.push({
      ...category,
      hint: s.nearest ? { name: s.nearest.name, distanceM: s.nearest.distance_m } : undefined,
    });
  }
  const picked = new Set(suggested.map((c) => c.value));
  return [...suggested, ...all.filter((c) => !picked.has(c.value))];
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** "lat,lng" rounded to ~11 m: a stable string to debounce on and to share the query cache. */
export function contextPointKey(lat: number | undefined, lng: number | undefined): string | null {
  return typeof lat === "number" && typeof lng === "number" ? `${round4(lat)},${round4(lng)}` : null;
}
