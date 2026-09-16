---
name: ecolink-architecture
description: Kiến trúc nền tảng của ecolink-client — Vite + React Router SPA giả dạng Next.js App Router. Nạp skill này TRƯỚC KHI sửa bất kỳ file nào trong repo, đặc biệt khi thêm route mới, khi thấy thư mục dạng app/(pages)/.../page.tsx, khi định import next/*, hoặc khi cần biết lệnh build/lint và bản đồ thư mục.
---

# Kiến trúc ecolink-client

## ⚠️ Điều quan trọng nhất: đây KHÔNG phải Next.js

Cấu trúc thư mục trông y hệt Next.js App Router (`app/(pages)/(main)/campaigns/[id]/page.tsx`, `loading.tsx`, `_components/`) **nhưng đây là Vite 7 + React 19 + react-router-dom 7, CSR thuần, không SSR**.

Repo được migrate từ Next.js và **giữ lại quy ước thư mục** cho đỡ phải sửa hàng loạt. Hệ quả:

| Bạn tưởng | Thực tế |
|---|---|
| `(main)`, `(admin)`, `(search)` là route group của Next | Chỉ là **tên thư mục**, router bỏ qua hoàn toàn |
| `[id]` là dynamic segment | Chỉ là tên thư mục. Param thật khai báo trong `src/routes/index.tsx` (`campaigns/:id`) |
| Tạo `page.tsx` là có route | **Sai.** Phải đăng ký tay trong `src/routes/index.tsx` |
| `loading.tsx` là Suspense boundary của Next | **Dead code.** Router không dùng file này |
| Cần `"use client"` | **Không.** Mọi thứ đều là client. Đừng thêm |
| `import Link from "next/link"` | **Không compile.** Dùng `@/libs/router` |

## Stack

| Mối quan tâm | Lựa chọn | File chính |
|---|---|---|
| Build / dev | Vite 7 | `vite.config.ts` |
| UI | React 19.2.3, CSR | `src/main.tsx`, `src/App.tsx` |
| Router | `react-router-dom` 7, `createBrowserRouter`, mọi page đều `lazy()` | `src/routes/index.tsx` |
| Server state | TanStack Query v5, bọc trong `useGet`/`usePost` | `hooks/reactQuery.ts`, `libs/queryClient.ts` |
| Client state | Zustand v5 + `persist` — **chỉ có 1 store** | `stores/useAuthStore.ts` |
| HTTP | Axios + interceptor refresh token | `libs/axiosClient.ts` → `utils/requestApi.ts` |
| Form | react-hook-form — **không zod/yup** | — |
| UI kit | shadcn/Radix (`components/ui/`), antd v6 dùng hạn chế | `components.json` |
| CSS | Tailwind v4, **không có file config** | `app/globals.css`, `app/_styles/` |
| i18n | i18next + react-i18next, `en` / `vi` | `i18n/index.ts` |
| Map | Leaflet + react-leaflet | `modules/LeafletAddressMap.tsx` |
| Toast | sonner, bọc trong `showMessage()` | `utils/showMessage.ts` |
| Test | **Không có** | — |

## Bản đồ thư mục

Mọi thư mục đều nằm ở **root repo**, không nằm dưới `src/`. Alias `@/*` trỏ về **root repo** (`tsconfig.app.json` + `vite.config.ts`).

```
app/
  (pages)/           # page component, tổ chức theo nhóm giao diện
    (main)/          # người dùng cuối: campaigns, incidents, organizations, gifts, profile, homepage
    (auth)/          # sign-in, sign-up, reset password, Google OAuth callback
    (admin)/         # console quản trị /admin/*
    (maps)/          # trang bản đồ toàn màn hình
  _styles/           # typography.css, button.css
  globals.css        # entry Tailwind v4 + design token dạng CSS custom property
apis/                # 1 thư mục / domain, mỗi file = 1 endpoint, types ở models/
components/
  ui/                # shadcn primitive (file lowercase) + primitive riêng của app (file PascalCase)
  client/            # layout/, providers/, shared/, ai-chat/ — phía người dùng cuối
  admin/             # layout/ (AdminShell...), shared/ (DataTable, ConfirmPopover)
  form/              # SelectListCampaign, SelectListOrganization, SelectListPriority
constants/           # status, priority, severity, difficulty, gamification, roles, i18n, notificationPreferences
hooks/               # reactQuery.ts (useGet/usePost), useDebounce, useGetParam, useQueryString, useMediaQuery, useLocalizedDisplay
i18n/                # index.ts + locales/{en,vi}/common.json
libs/                # axiosClient, queryClient, router.tsx (shim Next), utils.ts (cn), localizedText, compressImage, dynamic.tsx
modules/             # feature module dùng chung nhiều trang
src/                 # App.tsx, main.tsx, routes/index.tsx, layouts/, pages/NotFound.tsx
stores/              # useAuthStore.ts
types/               # BaseResponse.ts, PaginationResponse.ts
utils/               # requestApi, showMessage, logout, formattedDate, ...
vite/                # reverseGeocode.ts — middleware dev-only /api/reverse-geocode
```

## Shim Next.js — bắt buộc dùng

`libs/router.tsx` dựng lại API của Next trên react-router. Trong `app/` và `modules/`, **luôn import từ `@/libs/router`, không bao giờ import trực tiếp `react-router-dom`**.

```ts
import { Link, useRouter, usePathname, useSearchParams, useParams } from "@/libs/router";
```

Chú ý 2 khác biệt dễ sai:

```tsx
<Link href="/campaigns" />           // ✅ prop là href, KHÔNG phải to
const searchParams = useSearchParams();   // ✅ trả về URLSearchParams trực tiếp
const [sp, setSp] = useSearchParams();    // ❌ đây là API của react-router, không phải của shim
```

`useRouter()` trả về `{ push, replace, back, forward, refresh, prefetch }` — `prefetch` là no-op.

Hai shim còn lại:
- `@/components/ui/AppImage` thay `next/image` (hỗ trợ `fill`, `priority`, `sizes` — phần lớn là no-op).
- `@/libs/dynamic` thay `next/dynamic` (bọc `lazy` + `Suspense`).

## Thêm route mới = 2 chỗ sửa

1. Tạo `app/(pages)/<nhóm>/<route>/page.tsx` — **default export**, tên component `<Feature>Page`.
2. Đăng ký trong `src/routes/index.tsx` bằng helper `lazyPage`:

```tsx
{ path: "campaigns/me", element: lazyPage(() => import("@/app/(pages)/(main)/campaigns/me/page"), "campaigns-me") },
```

Cây route nằm dưới `RootLayout` và rẽ thành 5 nhánh layout:

| Layout | File | Dùng cho |
|---|---|---|
| `RootLayout` | `src/layouts/RootLayout.tsx` | ReactQueryProvider → TooltipProvider → I18nProvider + `<Toaster />` |
| `MainLayout` | `src/layouts/MainLayout.tsx` | Header / Footer / AI chat — trang người dùng cuối |
| `ProfileLayout` | `src/layouts/ProfileLayout.tsx` | nested trong `/profile` |
| `AuthLayout` | `src/layouts/AuthLayout.tsx` | trang đăng nhập / đăng ký |
| `AdminLayout` | `src/layouts/AdminLayout.tsx` → `components/admin/layout/AdminShell.tsx` | console `/admin/*` |
| `MapsLayout` | `src/layouts/MapsLayout.tsx` | `/maps` toàn màn hình |

## Ranh giới admin / client

| Tín hiệu | Admin | Client |
|---|---|---|
| Route | `/admin/*` (7 route) | phần còn lại (~20) |
| Page | `app/(pages)/(admin)/` | `app/(pages)/(main)/`, `(maps)/`, `(auth)/` |
| Component | `components/admin/` | `components/client/` |
| API | verify / ban / approve / process, `admin/gift-redemptions` | read / create / join / redeem |
| Theme | có dark mode (`AdminLayoutContext`, prop `isDark`) | không có dark mode |
| Button | `components/ui/button` | `components/client/shared/Button` |

Chi tiết xem skill `ecolink-admin-console` và `ecolink-client-pages`.

## Auth — và lỗ hổng cần biết

- `stores/useAuthStore.ts`: Zustand + `persist` (localStorage key `auth_store`), giữ `accessToken`, `refreshToken`, `user`, `permissions`.
  - Trong component: `useAuthStore((s) => s.user?.id)`.
  - Ngoài React: `useAuthStore.getState().accessToken`.
- `libs/axiosClient.ts` gắn `Authorization: Bearer`, `X-Refresh-Token`, `Accept-Language`. Gặp 401 → thử refresh **1 lần** → thất bại thì `setLogoutSuccess()` + `window.location.href = "/sign-in?redirect=..."`.

**⚠️ `/admin` KHÔNG có route guard.** Repo không có `ProtectedRoute` / `RequireAuth` / `AuthGuard`. `ADMIN_ROLE_ID` (`constants/roles.ts`) được dùng **đúng một lần**, ở `components/client/layout/Header.tsx`, chỉ để *ẩn* link menu:

```tsx
{user.roleId === ADMIN_ROLE_ID && (<DropdownMenuItem asChild><Link href="/admin">{t('Admin')}</Link></DropdownMenuItem>)}
```

Enforcement thật nằm ở server (`ecolink-server`). `permissions: string[]` trong store **chưa từng được đọc ở đâu**.

⇒ Đừng viết code dựa trên giả định "đã vào được `/admin` nghĩa là admin". Nếu được yêu cầu thêm guard, đó là **thay đổi hành vi thật** — hỏi trước.

## Lệnh

```bash
npm run dev      # Vite dev server, port 5173 (README ghi 3000 là sai)
npm run build    # tsc -b && vite build  ← cổng kiểm tra duy nhất
npm run lint     # eslint . --fix
npm run preview  # serve bản build
```

- **Không có test nào** trong repo, CI cũng không chạy lint/typecheck. Sau khi sửa, `npm run build` là cách xác minh thật sự.
- `.prettierrc` đặt `singleQuote: true` nhưng **không được enforce** — nhiều file dùng double quote, indent 4. **Bám theo style của file đang sửa**, đừng reformat hàng loạt.
- ESLint tắt `@typescript-eslint/no-unused-vars` nhưng bật `unused-imports/no-unused-imports` ở mức `error` — import thừa sẽ fail lint.

## Rác Next.js còn sót — đừng nhân bản

- `"use client"` còn ở 3 file (trong đó có `modules/ReportGeneralInformation/DuplicateReportModal.tsx`). Không thêm mới.
- Mọi `loading.tsx` là dead code.
- `components.json` vẫn ghi `"rsc": true` và `utils: "@/lib/utils"` — **sai**, `cn()` nằm ở `@/libs/utils`.
- `public/next.svg`, `public/vercel.svg` vẫn còn.

## Checklist trước khi commit

- [ ] Không có `import ... from "next/..."` nào mới.
- [ ] Không thêm `"use client"`.
- [ ] Nếu tạo `page.tsx` mới → đã đăng ký trong `src/routes/index.tsx`.
- [ ] Import navigation từ `@/libs/router`, không phải `react-router-dom`.
- [ ] Import `cn` từ `@/libs/utils`.
- [ ] Chuỗi hiển thị mới đã có trong **cả** `i18n/locales/en/common.json` và `vi/common.json`.
- [ ] `npm run build` pass.

## Skill liên quan

| Khi làm gì | Nạp skill |
|---|---|
| Thêm / sửa endpoint | `ecolink-api-layer` |
| Trang trong `/admin` | `ecolink-admin-console` |
| Trang người dùng cuối | `ecolink-client-pages` |
| Component UI, form, i18n | `ecolink-ui-and-forms` |
| Tách component dùng chung | `ecolink-feature-modules` |
