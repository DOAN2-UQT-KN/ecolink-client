import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";

/**
 * Active tab of a page with tabs, kept in `?tab=` so a tab can be linked. Switching tabs drops
 * the other query params: each tab owns the filters in the URL while it is open, and tabs reuse
 * names such as `search`, `status`, `page`.
 */
export function useUrlTab<T extends string>(tabs: readonly T[], fallback: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get("tab") as T | null;
  const tab = param && tabs.includes(param) ? param : fallback;

  const setTab = useCallback(
    (next: string) => {
      if (next === tab) return;
      router.replace(next === fallback ? pathname : `${pathname}?tab=${encodeURIComponent(next)}`, { scroll: false });
    },
    [fallback, pathname, router, tab],
  );

  return [tab, setTab] as const;
}
