import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";
import useGetParam from "@/hooks/useGetParam";
import { useGetModerationQueue } from "@/apis/incident/getModerationQueue";
import type {
  IGetModerationQueueRequest,
  IModerationQueueItem,
  ModerationFlag,
} from "@/apis/incident/models/moderation";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const NO_REPORTS: IModerationQueueItem[] = [];
const NO_COUNTS = { review: 0, auto_rejected: 0 };

function normalizePageSize(limit: number | null | undefined): number {
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? (limit as number)
    : DEFAULT_PAGE_SIZE;
}

function parseFlag(value: string | null | undefined): ModerationFlag {
  return value === "REJECT" ? "REJECT" : "REVIEW";
}

type ModerationContextType = {
  flag: ModerationFlag;
  page: number;
  pageSize: number;
  selectedId: string | null;
  reports: IModerationQueueItem[];
  total: number;
  counts: { review: number; auto_rejected: number };
  loading: boolean;
  error: boolean;
  refetch: () => void;
  onFlagChange: (flag: ModerationFlag) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelect: (id: string | null) => void;
  /** After a decision: the next report on this page, or none. */
  selectNext: () => void;
};

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

/** The URL is the only state (flag, page, limit, id), so back/forward and shared links just work. */
export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const flag = parseFlag(useGetParam<string>("flag", "string", ""));
  const page = Math.max(1, useGetParam<number>("page", "number", 1) ?? 1);
  const pageSize = normalizePageSize(useGetParam<number>("limit", "number", DEFAULT_PAGE_SIZE));
  const selectedId = useGetParam<string>("id", "string", "") || null;

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) params.set(key, value);
        else params.delete(key);
      });
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const request: IGetModerationQueueRequest = useMemo(
    () => ({ flag, page, limit: pageSize }),
    [flag, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useGetModerationQueue(request);

  const reports = data?.data?.reports ?? NO_REPORTS;
  const total = data?.data?.total ?? 0;
  const counts = data?.data?.counts ?? NO_COUNTS;

  const onFlagChange = useCallback(
    (next: ModerationFlag) =>
      setParams({ flag: next === "REVIEW" ? undefined : next, page: undefined, id: undefined }),
    [setParams],
  );
  const onPageChange = useCallback(
    (next: number) => setParams({ page: next > 1 ? String(next) : undefined }),
    [setParams],
  );
  const onPageSizeChange = useCallback(
    (next: number) => setParams({ limit: String(normalizePageSize(next)), page: undefined }),
    [setParams],
  );
  const onSelect = useCallback((id: string | null) => setParams({ id: id ?? undefined }), [setParams]);

  const selectNext = useCallback(() => {
    const index = reports.findIndex((r) => r.id === selectedId);
    const next = reports[index + 1] ?? (index > 0 ? reports[index - 1] : undefined);
    onSelect(next && next.id !== selectedId ? next.id : null);
  }, [onSelect, reports, selectedId]);

  const value = useMemo(
    () => ({
      flag,
      page,
      pageSize,
      selectedId,
      reports,
      total,
      counts,
      loading: isLoading,
      error: isError,
      refetch: () => void refetch(),
      onFlagChange,
      onPageChange,
      onPageSizeChange,
      onSelect,
      selectNext,
    }),
    [counts, flag, isError, isLoading, onFlagChange, onPageChange, onPageSizeChange, onSelect, page, pageSize, refetch, reports, selectNext, selectedId, total],
  );

  return <ModerationContext.Provider value={value}>{children}</ModerationContext.Provider>;
}

export function useModerationContext() {
  const ctx = useContext(ModerationContext);
  if (!ctx) throw new Error("useModerationContext must be used within ModerationProvider");
  return ctx;
}
