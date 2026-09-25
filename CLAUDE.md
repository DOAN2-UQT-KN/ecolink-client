# ecolink-client

Web frontend của nền tảng Ecolink — người dân báo cáo sự cố môi trường, tình nguyện viên và tổ chức chạy chiến dịch dọn dẹp, tích điểm xanh đổi quà. Chỉ chứa frontend; backend REST ở `VITE_API_URL`.

## ⚠️ Đây KHÔNG phải Next.js

Thư mục trông y hệt Next.js App Router (`app/(pages)/(main)/campaigns/[id]/page.tsx`, `loading.tsx`, `_components/`) nhưng thực chất là **Vite 7 + React 19 + react-router-dom 7, CSR thuần**. Repo migrate từ Next.js và giữ lại quy ước thư mục. `(main)`, `[id]` chỉ là tên thư mục — router bỏ qua. `loading.tsx` là dead code.

## Lệnh

```bash
npm run dev      # Vite dev server, port 5173
npm run build    # tsc -b && vite build  ← cổng kiểm tra duy nhất, repo KHÔNG có test
npm run lint     # eslint . --fix
```

## 5 luật không bao giờ được vi phạm

1. **Không `import ... from "next/..."`.** Navigation dùng `@/libs/router` (`<Link href>`, `useRouter()`, `usePathname()`, `useSearchParams()` trả về `URLSearchParams` trực tiếp). Ảnh dùng `@/components/ui/AppImage`. Lazy dùng `@/libs/dynamic`.
2. **Không thêm `"use client"`.** Vô nghĩa ở đây.
3. **Tạo `page.tsx` phải đăng ký route trong `src/routes/index.tsx`** bằng helper `lazyPage`. Quên = route không tồn tại.
4. **Mọi lời gọi API đi qua `utils/requestApi` + `hooks/reactQuery` (`useGet`/`usePost`)**, khai báo trong `apis/<domain>/<verb><Noun>.ts`. Không gọi `axios` trực tiếp (ngoại lệ duy nhất: upload Cloudinary). Toast qua `utils/showMessage`, không gọi `toast()` của sonner.
5. **Mọi chuỗi hiển thị qua `t()`**, key chính là câu tiếng Anh, và phải thêm vào **cả** `i18n/locales/en/common.json` lẫn `vi/common.json`.

Thêm 2 điểm hay sai: `cn()` nằm ở **`@/libs/utils`** (không phải `@/lib/utils` như `components.json` ghi), và Prettier **không được enforce** — bám style của file đang sửa, đừng reformat hàng loạt.

## Bảo mật cần biết

`/admin` có guard ở `src/layouts/AdminLayout.tsx`: chờ `has_hydrated` rồi mới quyết, chưa đăng nhập → `/sign-in?redirect=`, `roleId !== ADMIN_ROLE_ID` → `/`. **Guard này chỉ để người dùng không phải nhìn màn hình đầy request lỗi — enforcement thật nằm ở server.** Đừng viết code dựa trên giả định "vào được `/admin` nghĩa là admin".

Các trang phía người dùng cuối (`create/`, `me/`, `/profile/*`) **vẫn không có guard**: chặn thật là interceptor 401 trong `libs/axiosClient.ts`.

## Skill

| Khi làm gì | Nạp skill |
|---|---|
| Bất cứ việc gì trong repo (đọc trước) | `ecolink-architecture` |
| Thêm / sửa endpoint, mutation, cache | `ecolink-api-layer` |
| Trang, bảng, filter trong `/admin` | `ecolink-admin-console` |
| Trang người dùng cuối, form tạo, trang chi tiết | `ecolink-client-pages` |
| Component UI, styling, form, i18n | `ecolink-ui-and-forms` |
| Tách component dùng chung ra `modules/` | `ecolink-feature-modules` |

Bản đầy đủ ở `.claude/skills/<name>/SKILL.md`. Cursor có bản sao y hệt ở `.cursor/skills/<name>/SKILL.md` (sửa skill thì sửa cả hai), cộng bản rút gọn tự nạp theo `globs` ở `.cursor/rules/*.mdc`.
