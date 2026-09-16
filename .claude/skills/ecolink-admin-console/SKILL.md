---
name: ecolink-admin-console
description: Khuôn chuẩn cho console quản trị /admin của ecolink-client — page.tsx + _context đồng bộ URL + FormFilter + DataTable + ConfirmPopover, AdminShell và dark theme. Nạp khi thêm hoặc sửa bất kỳ thứ gì trong app/(pages)/(admin)/ hoặc components/admin/, khi làm bảng CRUD quản trị, filter, phân trang, hoặc dialog xác nhận duyệt/ban.
---

# Console quản trị `/admin`

## Phạm vi

- Page: `app/(pages)/(admin)/admin/<resource>/`
- Component dùng chung: `components/admin/layout/`, `components/admin/shared/`
- Layout: `src/layouts/AdminLayout.tsx` → `components/admin/layout/AdminShell.tsx`
- Nav: `app/(pages)/(admin)/_config/adminNav.ts`
- State layout (collapse / mobile / theme): `app/(pages)/(admin)/_context/AdminLayoutContext.tsx`

Route hiện có: `/admin`, `/admin/campaigns`, `/admin/incidents`, `/admin/organizations`, `/admin/users`, `/admin/gifts`, `/admin/settings`.

⚠️ **`/admin` không có route guard.** Xem skill `ecolink-architecture`.

## Khuôn 5 phần của một trang CRUD

Cả 5 trang quản trị hiện có đều theo đúng khuôn này. Bám theo, đừng sáng tạo.

```
app/(pages)/(admin)/admin/<resource>/
  page.tsx        # <XProvider><XContent /></XProvider>
  loading.tsx     # dead code, router không dùng — tạo cho đồng bộ hoặc bỏ qua
  _components/
    DataTable.tsx            # định nghĩa column, gọi shared DataTable
    FormFilter.tsx           # bộ lọc
    <Action>Confirm.tsx      # VerifyIncidentConfirm, BanUserConfirm, ApproveOrganizationConfirm...
    Preview<X>Popover.tsx    # xem nhanh 1 record
    <X>FormDialog.tsx        # (nếu có CRUD tạo/sửa)
  _context/
    <X>Context.tsx           # filter + pagination + đồng bộ URL + gọi useGetX
  _services/
    <x>-form.service.ts      # (tuỳ chọn) form value types, defaults, transform — KHÔNG có HTTP
```

## `page.tsx` — Provider bọc ngoài, nội dung bên trong

```tsx
function GiftsContent() {
  const { t } = useTranslation();
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Gifts"), path: "/admin/gifts", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      <FormFilter />
      <DataTable />
    </div>
  );
}

export default function AdminGiftsPage() {
  return (
    <GiftProvider>
      <GiftsContent />
    </GiftProvider>
  );
}
```

- Component nội dung **phải tách riêng** để nằm bên trong Provider (hook context sẽ throw nếu không).
- `Breadcrumbs` luôn truyền `isAdmin={true}` (đổi màu cho nền tối).
- Wrapper ngoài cùng: `<div className="space-y-6">`.

## `_context/<X>Context.tsx` — trái tim của trang

Nhiệm vụ: giữ `filters` + `pagination`, **đồng bộ hai chiều với query string trên URL**, build request và gọi hook query.

Tham chiếu chuẩn: `app/(pages)/(admin)/admin/gifts/_context/GiftContext.tsx`.

### Bộ khung

```tsx
import { usePathname, useRouter, useSearchParams } from "@/libs/router";
import useGetParam from "@/hooks/useGetParam";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

export function GiftProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // 1. Đọc URL
  const urlSearch = useGetParam<string>("search", "string", "");
  const urlPage   = useGetParam<number>("page", "number", 1);
  const urlLimit  = useGetParam<number>("limit", "number", 10);

  // 2. State nội bộ, khởi tạo từ URL
  const [filters, setFilters] = useState<GiftFormFilterValues>({ ... });
  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  // 3. URL đổi (back/forward) → đồng bộ ngược vào state, có short-circuit tránh loop
  useEffect(() => { /* setFilters(prev => đã bằng thì return prev) */ }, [urlSearch, urlPage, urlLimit]);

  // 4. Ghi URL
  const setParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.length > 0) params.set(key, value);
      else params.delete(key);
    });
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router]);

  // 5. Build request, memo hoá
  const request: IGetGiftsRequest = useMemo(() => ({
    page: pagination.current,
    limit: pagination.pageSize,
    search: filters.search.trim() || undefined,
    isActive: filters.activeFilter === "all" ? undefined : filters.activeFilter === "active",
  }), [filters, pagination]);

  const { data, isLoading } = useGetGifts(request);

  const gifts = data?.data?.gifts ?? [];
  const total = data?.data?.meta?.total ?? data?.data?.total ?? 0;

  // 6. Handler — đổi filter LUÔN reset về trang 1
  // onFilterChange / onResetFilters / onPageChange / onPageSizeChange

  const value = useMemo(() => ({ filters, pagination, gifts, total, loading: isLoading, ... }), [...]);
  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
}

export function useGiftContext() {
  const ctx = useContext(GiftContext);
  if (!ctx) throw new Error("useGiftContext must be used within GiftProvider");
  return ctx;
}
```

### Quy tắc

- `searchParamsRef` là bắt buộc — `setParams` phải đọc giá trị mới nhất mà không đưa `searchParams` vào deps (tránh recreate liên tục).
- `router.replace(..., { scroll: false })` — dùng `replace`, không dùng `push`, để filter không làm rác history.
- Giá trị rỗng / `"all"` thì **xoá param** khỏi URL chứ không set chuỗi rỗng.
- `onFilterChange` luôn `setPagination(prev => ({ ...prev, current: 1 }))` và set `page: "1"`.
- Parser riêng cho từng loại param (`parseActiveFilter`, `parseSortOrder`, `normalizePageSize`) — không tin URL.
- `request` và `value` đều `useMemo`; hook consumer throw khi dùng ngoài Provider.

## `_components/FormFilter.tsx`

Pattern `FormFieldConfig[]` — mảng `{ key, label, render }` render vào grid `<Field>`:

```tsx
type FormFieldConfig = { key: string; label: string; render: () => React.ReactNode };

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useGiftContext();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);
  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== filters.search) onFilterChange({ search: next });
  }, [debouncedSearch, onFilterChange, filters.search]);

  const formFields: FormFieldConfig[] = useMemo(() => [ /* ... */ ], [...]);

  return (
    <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {formFields.map((field) => (
          <Field key={field.key}>
            <FieldLabel className="text-sm font-medium text-foreground-secondary">{field.label}</FieldLabel>
            {field.render()}
          </Field>
        ))}
      </div>
    </div>
  );
}
```

- Ô search có state cục bộ + `useDebounce(..., 500)` rồi mới đẩy lên context (tránh gọi API mỗi ký tự).
- Select dùng `Select / SelectTrigger / SelectValue / SelectContent / SelectItem` từ `@/components/ui/select`, trigger có `className="!h-10 w-full !border !border-input"`.

## `components/admin/shared/DataTable`

Import qua barrel:

```ts
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
```

`DataTableColumn<T>`:

```ts
type DataTableColumn<T> = {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  width?: number | string;
  className?: string;
  sticky?: "left" | "right";
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean | ((record: T) => boolean);
  sortValue?: (record: T) => string | number | Date | null | undefined;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  renderEditor?: (params: { value: unknown; record: T; onSave: (v: unknown) => void; onCancel: () => void }) => ReactNode;
};
```

Props của `DataTable` nhóm theo object: `columns`, `data`, `loading`, `error`, `onRetry`, `rowKey`, `theme`, `emptyTitle`, `emptyDescription`, `emptyAction`, `stickyHeader`, `pageSizes`, `loadingRowCount`, `search`, `filters`, `sorting`, `pagination`, `rowSelection`, `inlineEdit`, `permission`, `virtualization`, `infiniteScroll`, `onRowClick`.

`pagination` là **1-based**:

```tsx
pagination={{
  page: pagination.current,
  pageSize: pagination.pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}}
```

`sorting.mode` là `"client" | "server"` — client sort dùng `sortValue ?? dataIndex`.

### Cách viết `_components/DataTable.tsx`

```tsx
const COLUMN_KEYS = { NO: "no", INCIDENT: "incident", STATUS: "status", ACTIONS: "actions" } as const;

const columns: DataTableColumn<IIncident>[] = useMemo(() => [
  {
    key: COLUMN_KEYS.NO,
    title: t("No."),
    width: 60,
    render: (_v, _r, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  // ...
], [isDark, pagination.current, pagination.pageSize, t]);
```

- `COLUMN_KEYS` khai báo `as const` ở đầu file.
- `columns` luôn `useMemo`.
- Số thứ tự tính bằng `(current - 1) * pageSize + index + 1`.
- Cell chứa nút phải chặn click lan ra row:

```tsx
<div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} role="presentation">
```

`DataTablePermission<T>` (`role: "admin" | "staff"`) đã có sẵn nhưng **hiện chưa call site nào truyền** — đừng giả định nó đang hoạt động.

## `ConfirmPopover` — dialog xác nhận

`components/admin/shared/ConfirmPopover.tsx` (tên là Popover nhưng bên trong là shadcn `Dialog`).

```ts
type ConfirmPopoverProps = {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | boolean | Promise<void | boolean>;
  rejectLabel?: string;
  onReject?: () => void | boolean | Promise<void | boolean>;
  cancelLabel?: string;
  theme?: "light" | "dark";          // mặc định "dark"
  confirmPending?: boolean;
  rejectPending?: boolean;
  extraContent?: ReactNode;          // slot cho input/select thêm
  onOpenChange?: (open: boolean) => void;
  confirmDisabled?: boolean;
};
```

**`onConfirm` trả về `false` thì dialog KHÔNG đóng** — dùng để validate trước khi đóng. Ví dụ đầy đủ với 2 mutation + validate: `app/(pages)/(admin)/admin/incidents/_components/VerifyIncidentConfirm.tsx`.

## Dark theme

Admin có dark mode, client thì không. Cơ chế:

- `AdminLayoutContext` giữ `{ collapsed, isMobile, theme }`; `AdminShell` gắn class `dark` lên div gốc khi `theme === "dark"`.
- Trong component, dark mode được truyền **bằng prop `isDark: boolean`** rồi rẽ nhánh trong `cn()`:

```tsx
className={cn("text-xs font-medium", isDark ? "text-zinc-200" : "text-foreground")}
```

**Không dùng biến thể `dark:` của Tailwind** cho code admin — theme là React context, không phải class trên `<html>`.

## Thêm trang admin mới

- [ ] Tạo `app/(pages)/(admin)/admin/<resource>/` với `page.tsx`, `_context/<X>Context.tsx`, `_components/{DataTable,FormFilter}.tsx`.
- [ ] Endpoint list dùng `useGetX` từ `apis/<domain>/` (xem skill `ecolink-api-layer`).
- [ ] Đăng ký route trong `src/routes/index.tsx` dưới nhánh `path: "admin"`.
- [ ] Thêm mục vào `app/(pages)/(admin)/_config/adminNav.ts` (`labelKey` là key i18n, `icon` lấy từ `react-icons/tb`).
- [ ] Mọi label mới thêm vào **cả** `i18n/locales/en/common.json` và `vi/common.json`.
- [ ] `npm run build` pass.
