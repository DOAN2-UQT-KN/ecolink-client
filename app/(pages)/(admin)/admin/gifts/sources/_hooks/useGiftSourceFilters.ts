import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";
import type { GiftSourceStatus, GiftSourceType, IGetGiftSourcesRequest } from "@/apis/gift-source/models/giftSource";

const TYPES: GiftSourceType[] = ["SPONSOR", "ECOLINK", "DONATION"];
const STATUSES: GiftSourceStatus[] = ["ACTIVE", "INACTIVE"];
const PAGE_SIZES = [10, 20, 50, 100];
const PARAM = { type: "sourceType", status: "sourceStatus", search: "sourceSearch" } as const;

/**
 * Filters and paging of the source list live in the URL; this reads and writes them. Keys are
 * prefixed with "source" because the catalog tab on the same page uses search/page/limit.
 */
export function useGiftSourceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const request: IGetGiftSourcesRequest = useMemo(() => {
    const type = searchParams.get("sourceType") as GiftSourceType | null;
    const status = searchParams.get("sourceStatus") as GiftSourceStatus | null;
    const page = Number(searchParams.get("sourcePage"));
    const limit = Number(searchParams.get("sourceLimit"));
    return {
      type: type && TYPES.includes(type) ? type : undefined,
      status: status && STATUSES.includes(status) ? status : undefined,
      search: searchParams.get("sourceSearch")?.trim() || undefined,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      limit: PAGE_SIZES.includes(limit) ? limit : 10,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** Changing a filter goes back to page 1. */
  const setFilter = useCallback(
    (key: "type" | "status" | "search", value: string | undefined) =>
      setParams({ [PARAM[key]]: value, sourcePage: undefined }),
    [setParams],
  );
  const setPage = useCallback((page: number) => setParams({ sourcePage: String(page) }), [setParams]);
  const setPageSize = useCallback(
    (size: number) => setParams({ sourceLimit: String(size), sourcePage: undefined }),
    [setParams],
  );

  return { request, setFilter, setPage, setPageSize };
}
