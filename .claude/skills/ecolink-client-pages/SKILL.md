---
name: ecolink-client-pages
description: Khuôn trang phía người dùng cuối của ecolink-client — 4 dạng trang (search)/[id]/create/me, _context giữ form và mutation, _hooks accessor throw, _services transform thuần, các layout Main/Profile/Auth/Maps. Nạp khi thêm hoặc sửa trang trong app/(pages)/(main), (auth), (maps), hoặc components/client/.
---

# Trang phía người dùng cuối

## Phạm vi

- `app/(pages)/(main)/` — homepage, campaigns, incidents, organizations, gifts, profile
- `app/(pages)/(auth)/` — sign-in, sign-up, reset password, Google OAuth callback
- `app/(pages)/(maps)/` — `/maps` toàn màn hình
- `components/client/` — layout, providers, shared, ai-chat

## Layout

| Layout | Bọc gì |
|---|---|
| `src/layouts/MainLayout.tsx` | `<Header />` + `<ClickSpark>` bọc `<main className="py-[92px] px-[20px] lg:px-[80px]">` + `<AiChatWidget />` (trong Suspense) + `<Footer />` |
| `src/layouts/ProfileLayout.tsx` | sidebar `<ProfileTabs />` 200px + nội dung — nested trong `/profile` |
| `src/layouts/AuthLayout.tsx` | bố cục chia đôi + `LanguageSwitcher` |
| `src/layouts/MapsLayout.tsx` | toàn màn hình, không header/footer |

Layout đã lo padding trang — **đừng thêm padding ngoài cùng lần nữa** trong `page.tsx`.

## 4 dạng trang cho mỗi resource

```
app/(pages)/(main)/campaigns/
  (search)/     # trang tìm kiếm / duyệt danh sách công khai
  [id]/         # trang chi tiết (route thật là campaigns/:id)
  create/       # form tạo mới
  me/           # danh sách của chính tôi, thường là bảng + filter
```

⚠️ **`organizations/` là ngoại lệ**: tổ chức không còn được tạo trực tiếp. `organizations/create`
chỉ còn là `<Navigate to="/organizations/apply" replace />` trong `src/routes/index.tsx`, và dạng
trang thứ 5 `apply/` mới là nơi nộp hồ sơ — **wizard nhiều bước, công khai, không cần đăng nhập**
(`apply/`, `apply/submitted/`, `apply/status/:id`). Tổ chức chỉ ra đời sau khi admin duyệt hồ sơ.

Cùng bộ thư mục con:

```
  page.tsx        # default export, tên component <Feature>Page
  loading.tsx     # dead code, router không dùng
  _components/    # component chỉ dùng cho route này
  _context/       # Provider giữ state / form / mutation
  _hooks/         # hook truy cập context, throw khi ngoài Provider
  _services/      # hàm thuần: form types, defaults, transform — KHÔNG có HTTP
```

⚠️ `[id]` chỉ là tên thư mục. Route thật khai báo trong `src/routes/index.tsx`, và **không phải lúc nào cũng khớp**: thư mục `organizations/[id]/` nhưng route là `organizations/:slug`.

## Page header — chỉ breadcrumbs, không có tiêu đề

Đây là chỗ dễ làm sai nhất vì trực giác bảo "trang nào chả có `<h1>`". **Không trang client nào
trong repo có tiêu đề hay đoạn mô tả.** Header của một trang client = đúng một thứ: breadcrumbs.

```tsx
import { Breadcrumbs, BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";

const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Apply", path: "/organizations/apply", type: "page" },
];
```

Luôn bắt đầu bằng `Home` và kết thúc bằng trang hiện tại với `type: "page"`.

### Chọn khuôn theo dạng trang

| Dạng trang | Header |
|---|---|
| `(search)/`, `gifts` | thanh **sticky** + `mb-8`, thường kèm `<div className="mt-4">` chứa tabs / filter |
| `create/` | thanh **sticky**, KHÔNG `mb-8`, thân trang mở bằng `pt-5` |
| `[id]/`, `me/` | `<Breadcrumbs>` **trần**, là con đầu tiên của div ngoài cùng |
| `/admin/*` | `<Breadcrumbs isAdmin />` trong `<div className="space-y-6">`, không sticky |

Thanh sticky (copy nguyên văn — `campaigns/create`, `incidents/create`, `organizations/apply`,
và cả 3 trang `(search)` đều dùng đúng chuỗi class này):

```tsx
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setIsScrolled(window.scrollY > 10);
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

<div className="w-full h-full">
  <div
    className={cn(
      "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20",
      isScrolled ? "pt-[100px]" : "pt-0",
    )}
  >
    <Breadcrumbs breadcrumbs={breadcrumbs} />
  </div>
  <div className="flex flex-col gap-[30px] w-full h-full pt-5">
```

Lề âm `-mx-4 lg:-mx-20` bù padding của `MainLayout` (`py-[92px] px-[20px] lg:px-[80px]`) để thanh
tràn hết chiều ngang; `pt-[100px]` khi cuộn là để che khoảng trống của header trong suốt.
**Đừng "dọn" hai thứ này.**

### Ba điều dễ sai

1. **Không thêm `<h1>` / đoạn mô tả.** Cần chỗ đặt nút hành động thì các trang `me/` để một hàng
   `<div className="w-full flex items-center justify-end">` ngay dưới breadcrumbs, không phải tiêu đề.
2. **`Breadcrumbs` tự gọi `t(item.label)` bên trong** (`Breadcrumbs.tsx:40,44`) → `label` để tiếng
   Anh thô. Vài trang cũ bọc thêm `t()` ở ngoài; chạy được nhờ bản dịch round-trip, nhưng là thừa.
3. **Không có component `PageHeader` dùng chung** — đừng đi tìm, cũng đừng tạo mới.

## `_context/` — nơi giữ form và mutation

Với trang `create/` và các form trải nhiều component, `useForm` khởi tạo **trong Context**, rồi bọc `FormProvider`:

```tsx
export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<IncidentFormValues>({
    defaultValues: { title: '', description: '', severityLevel: 1, imageStrings: [], /* ... */ },
  });

  const { mutate: createIncident, isPending } = useCreateReport({
    onSuccess: () => {
      form.reset();
      router.push('/incidents/me');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['all-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });

  const onSubmit = useCallback(async (data: IncidentFormValues) => {
    setIsUploading(true);
    const urls = await uploadMultipleImages(data.imageStrings);
    createIncident(transformToApiData(data, urls));
    setIsUploading(false);
  }, [createIncident]);

  return (
    <IncidentContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};
```

Component field con lấy form bằng `useFormContext()`, không truyền prop xuyên tầng.

**Pipeline submit chuẩn**: upload ảnh → `transformToApiData()` → mutate → `onSuccess` reset + điều hướng + invalidate.

Trang `me/` và `(search)/` dùng Context kiểu filter + pagination + đồng bộ URL, **giống hệt** khuôn ở skill `ecolink-admin-console` (tham chiếu: `app/(pages)/(main)/campaigns/me/_context/CampaignMeContext.tsx`).

## `_hooks/` — accessor throw

```ts
export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error('useIncident must be used within an IncidentProvider');
  return context;
};
```

Một số trang export thẳng hook từ `_context/` thay vì tách `_hooks/` — cả hai đều chấp nhận được, theo file xung quanh.

## `_services/` — hàm thuần, KHÔNG gọi HTTP

Chứa: kiểu giá trị form, defaults, parser, builder request.

```ts
// _services/incident.service.ts — chuyển camelCase của form sang snake_case của API
export function transformToApiData(data: IncidentFormValues, imageUrls: string[]): ICreateReportRequest { ... }

// _services/gift.service.ts
export function buildGiftFilters(...) { ... }
export function buildGiftRequest(...) { ... }

// _services/<x>-form.service.ts
export const DEFAULT_GIFT_FORM_VALUES: GiftFormValues = { ... };
export function giftToFormValues(gift: IGift): GiftFormValues { ... }
```

Ngoại lệ có chủ đích: `app/(pages)/(auth)/sign-in/_services/auth.service.ts` chứa side effect sau đăng nhập (`setLoginSuccess` + set cookie `refresh_token` + `router.push(redirect)`) — logic đăng nhập nằm ở service, không nằm trong component.

## Quyền truy cập

**Trang client không có route guard.** `create/`, `me/`, `/profile/*` đều render cho mọi người (guard duy nhất của repo nằm ở `/admin`, xem `ecolink-architecture`); chặn thật là:

1. Request 401 → interceptor trong `libs/axiosClient.ts` redirect `/sign-in?redirect=...`.
2. Kiểm tra sở hữu do **server tính sẵn** rồi trả về cờ boolean:

```tsx
// app/(pages)/(main)/campaigns/[id]/_context/CampaignDetailContext.tsx
const canManageCampaign = Boolean(campaign?.can_manage_campaign);
```

```tsx
// app/(pages)/(main)/organizations/[id]/_context/OrganizationDetailContext.tsx
// so sánh organization.owner_id === currentUserId, và is_member
```

⚠️ `IOrganization.owner_id` là **`string | null`**: tổ chức vừa được duyệt tồn tại một lúc ngắn
trước khi tài khoản ORG được tạo xong. Mọi so sánh chủ sở hữu phải chịu được `null`, đừng
`owner_id!` hay ép kiểu.

⇒ Khi cần ẩn/hiện chức năng theo quyền, **ưu tiên cờ do API trả về**, đừng tự suy luận từ role ở client.

Đọc user hiện tại:

```tsx
const userId = useAuthStore((s) => s.user?.id);          // trong component
useAuthStore.getState().accessToken;                      // ngoài React
```

Đăng xuất: gọi API `signOut()` → `clearAuthStorage()` (`utils/logout.ts`) → `setLogoutSuccess()` → `router.push('/authenticate')`.

## Component dùng chung phía client

`components/client/shared/` — dùng lại trước khi viết mới:

`Breadcrumbs` · `Button` · `CampaignTaskCard` · `CollapseCard` · `ContentCard` · `DataTable` (bản antd-flavour, khác bản admin) · `Divider` · `DropdownMenu` · `FeatureCard` · `LanguageSwitcher` · `PageSuspense` · `PopoverCreateUpdateTask` · `SingleImageFileField` · `SpotlightCard` · `StatsCard` · `SummaryCampaignCard` · `Tag`

`components/client/shared/DataTable.tsx` có API kiểu antd: `columns: ColumnType<T>[]`, `dataSource`, `pagination: {current,pageSize,total} | false`, `onChange(pagination, filters)`, `filter`, `emptyText`. **Khác hoàn toàn** bản `components/admin/shared/DataTable` — đừng lẫn.

Nút phía public dùng `components/client/shared/Button` với `variant="green" | "brown" | "outlined-green" | "outlined-brown"`, không dùng `components/ui/button`.

## Checklist thêm trang client mới

- [ ] Tạo `app/(pages)/(main)/<resource>/<dạng>/page.tsx` — default export.
- [ ] Header **chỉ có `<Breadcrumbs>`** — không `<h1>`, không mô tả. Trang `(search)`/`create` bọc thanh sticky.
- [ ] Thêm `_context` nếu có state dùng chung; `_services` cho transform thuần; `_components` cho phần trình bày.
- [ ] Đăng ký route trong `src/routes/index.tsx` dưới đúng nhánh layout.
- [ ] Navigation import từ `@/libs/router` (`<Link href>`, `useRouter()`).
- [ ] Dữ liệu qua hook trong `apis/` (skill `ecolink-api-layer`).
- [ ] Ẩn/hiện chức năng theo cờ quyền do API trả về, không tự suy từ role.
- [ ] Chuỗi mới thêm vào **cả** `en/common.json` và `vi/common.json`.
- [ ] `npm run build` pass.
