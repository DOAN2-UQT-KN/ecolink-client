import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";
import type { GiftRedemptionStatus } from "@/apis/gift/models/gift";

export const REDEEM_STATUSES: GiftRedemptionStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

/**
 * Status, source, order code and page of the redeem orders tab, kept in the URL (spec 016 US4). Keys are prefixed
 * with "redeem" like the source tab's, since the tabs share one page.
 */
export function useRedeemFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const status = searchParams.get("redeemStatus") as GiftRedemptionStatus | null;
    const page = Number(searchParams.get("redeemPage"));
    return {
      status: status && REDEEM_STATUSES.includes(status) ? status : undefined,
      sourceId: searchParams.get("redeemSource") || undefined,
      code: searchParams.get("redeemCode") || undefined,
      page: Number.isInteger(page) && page > 0 ? page : 1,
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
  const setStatus = useCallback(
    (status: GiftRedemptionStatus | undefined) => setParams({ redeemStatus: status, redeemPage: undefined }),
    [setParams],
  );
  const setSourceId = useCallback(
    (sourceId: string | undefined) => setParams({ redeemSource: sourceId, redeemPage: undefined }),
    [setParams],
  );
  const setCode = useCallback(
    (code: string | undefined) => setParams({ redeemCode: code, redeemPage: undefined }),
    [setParams],
  );
  const setPage = useCallback((page: number) => setParams({ redeemPage: String(page) }), [setParams]);

  return { ...filters, setStatus, setSourceId, setCode, setPage };
}
