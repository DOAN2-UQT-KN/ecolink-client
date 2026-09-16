---
name: ecolink-ui-and-forms
description: Quy ước UI, styling và form của ecolink-client — chọn giữa components/ui (shadcn) và antd, design token Tailwind v4, cn(), hai loại Button, react-hook-form không schema lib, upload ảnh Cloudinary, và luật i18n bắt buộc. Nạp khi viết component, dialog, form, khi chọn class Tailwind, hoặc khi thêm chuỗi hiển thị mới.
---

# UI, styling & form

## Chọn thư viện component

| Nhu cầu | Dùng |
|---|---|
| Dialog / modal | **luôn** shadcn `@/components/ui/dialog` — không dùng antd Modal |
| Input, Select, Tabs, Table, Checkbox, Tooltip... | `@/components/ui/*` |
| Xem ảnh có zoom / preview group | `antd` `Image`, `Image.PreviewGroup` |
| Tag nhỏ có sẵn màu | `antd` `Tag` (thường kèm override `!m-0`) hoặc `@/components/ui/StatusTag` / `TagStatus` |
| Bảng admin | `@/components/admin/shared/DataTable` |
| Bảng client | `@/components/client/shared/DataTable` (API kiểu antd) |

antd v6 **chỉ dùng hạn chế** ở những chỗ trên. Mặc định là shadcn/Radix.

## `components/ui/` có 2 quy ước tên file

```
components/ui/
  button.tsx  dialog.tsx  field.tsx  input.tsx  select.tsx  table.tsx  tabs.tsx
  badge.tsx  skeleton.tsx  sonner.tsx  tooltip.tsx  empty.tsx  calendar.tsx ...   ← shadcn primitive, lowercase
  AppImage.tsx  StatusTag.tsx  TagStatus.tsx  GiftCard.tsx  ClickSpark.tsx
  RichTextEditor.tsx  RichTextContent.tsx  TooltipTruncatedText.tsx ...            ← primitive riêng của app, PascalCase
```

Primitive shadcn viết theo khuôn: file lowercase, `function Component({ className, ...props })`, gắn `data-slot="x"`, biến thể bằng `cva`, gộp class bằng `cn()`, hỗ trợ `asChild` qua `Slot.Root` của `radix-ui`.

## ⚠️ `cn()` nằm ở `@/libs/utils`

```ts
import { cn } from "@/libs/utils";   // ✅
import { cn } from "@/lib/utils";    // ❌ không tồn tại
```

`components.json` ghi `utils: "@/lib/utils"` — **đó là sai sót trong config**, path đó không có thật.

## Hai loại Button

```tsx
// Trang public / người dùng cuối
import { Button } from "@/components/client/shared/Button";
<Button variant="green" size="large" isLoading={isPending} iconLeft={<Icon />}>{t("Join now")}</Button>
```

`variant`: `"green" | "brown" | "outlined-green" | "outlined-brown"` (mặc định `green`) → map sang class `btn-green`... định nghĩa trong `app/_styles/button.css`.
`size`: `"large" | "medium" | "small"` (mặc định `large`).
Props riêng: `iconLeft`, `iconRight`, `isLoading`, `isDisabled`.

```tsx
// Admin và bên trong dialog
import { Button } from "@/components/ui/button";
```

## Tailwind v4 — không có file config

Không có `tailwind.config.js`. Cấu hình nằm trong CSS:

- `app/globals.css` — entry Tailwind + design token dạng CSS custom property.
- `app/_styles/typography.css`, `app/_styles/button.css` — class có sẵn cho chữ và nút.

Token thương hiệu (dùng trực tiếp qua class như `text-foreground-secondary`, `bg-background-primary`, `text-button-accent`):

```
--foreground-primary / -secondary / -tertiary
--background-primary / -secondary / -tertiary / -quaternary
--border-input
--button-accent / --button-accent-hover
--font-title (Playfair Display) / --font-display (Be Vietnam Pro) / --font-logo (Instrument Serif)
--neutral-shadows-100..600 / --primary-shadows-100..600 / --secondary-shadows-100..600
```

Ngoài ra là bộ token shadcn chuẩn (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--destructive`, ... ở dạng `oklch`).

⇒ Cần màu mới thì **thêm token vào `globals.css`**, đừng hardcode hex rải rác.

## Dark mode

Chỉ admin có. Cơ chế là **prop `isDark: boolean` truyền xuống + ternary trong `cn()`**, không phải biến thể `dark:` của Tailwind:

```tsx
className={cn("text-xs font-medium", isDark ? "text-zinc-200" : "text-foreground")}
```

Lý do: theme là React context (`AdminLayoutContext`), class `dark` chỉ gắn trên div gốc của `AdminShell`.

## Form — react-hook-form, KHÔNG có zod/yup

Repo không dùng schema library. Validate khai báo inline trong `register()`, message bọc `t()`:

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ISignInFormValues>();

<Field>
  <FieldLabel htmlFor="email">{t("Email")} <span className="text-destructive">*</span></FieldLabel>
  <Input
    id="email"
    type="email"
    placeholder={t("example@email.com")}
    {...register("email", {
      required: t("Email is required"),
      pattern: { value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, message: t("Invalid email format") },
    })}
    aria-invalid={!!errors.email}
  />
  {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
</Field>
```

Quy ước cố định:

- Bọc bằng `<Field>` + `<FieldLabel>` từ `@/components/ui/field`.
- Dấu bắt buộc: `<span className="text-destructive">*</span>`.
- Lỗi: `<span className="text-red-500 text-sm mt-1">`.
- `aria-invalid={!!errors.x}` trên input.

### Form nhiều component

`useForm` khởi tạo trong `_context/`, bọc `<FormProvider {...form}>`, field con dùng `useFormContext()`. Xem skill `ecolink-client-pages`.

### Form trong modal

```tsx
const form = useForm<GiftFormValues>({ defaultValues: DEFAULT_GIFT_FORM_VALUES });

useEffect(() => {
  if (!open) return;
  form.reset(mode === "edit" && gift ? giftToFormValues(gift) : DEFAULT_GIFT_FORM_VALUES);
}, [open, mode, gift, form]);

const onSubmit = form.handleSubmit(async (data) => {
  try {
    await createMutation.mutateAsync({ ...data, greenPoints: Number.parseInt(data.greenPoints, 10) });
  } catch {
    // usePost surfaces API errors.
  }
});
```

- Giá trị số **giữ dạng string** trong form state, parse lúc submit (`greenPoints: string`).
- `catch {}` để trống — `usePost` đã bắn toast lỗi.
- Defaults và hàm `entityToFormValues` đặt trong `_services/<x>-form.service.ts`.

### Field component dùng lại

- `components/client/shared/SingleImageFileField.tsx` — chọn 1 ảnh.
- `components/form/SelectListCampaign.tsx`, `SelectListOrganization.tsx`, `SelectListPriority.tsx` — controlled, props `{ value, onChange, disabled, className, placeholder }`, `React.FC<Props>`, default export.

## Upload ảnh

Luồng: chọn file → `libs/compressImage.ts` (và `libs/getCroppedImage.ts` nếu có crop) → upload thẳng lên Cloudinary → gửi URL cho API.

```ts
// app/(pages)/(main)/incidents/create/_services/upload.service.ts
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "example";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "example";
export const uploadToCloudinary = async (file: File | Blob | string): Promise<string> => { ... }
```

Đây là **ngoại lệ duy nhất được gọi `axios` trực tiếp** (vì đích không phải API của mình). Mọi lời gọi khác phải qua `requestApi`.

Hiển thị ảnh: `@/components/ui/AppImage` (shim của `next/image`, hỗ trợ `fill`, `priority`, `sizes`). Ảnh tĩnh trong `public/` tham chiếu bằng `"/ten-file.png"`.

## i18n — luật bắt buộc

1. **Mọi chuỗi hiển thị đi qua `t()`.**
2. **Key chính là câu tiếng Anh**: `t("Gift created successfully")`.
3. Thêm key mới phải sửa **cả hai** file — `i18n/locales/en/common.json` và `i18n/locales/vi/common.json`. Hai file phải luôn cùng bộ key.
4. Namespace duy nhất: `common`. Ngôn ngữ: `en` (mặc định) và `vi`.

```tsx
const { t } = useTranslation();
t("Duplicate media detected")
t("This will ban {{name}}.", { name: incidentTitle })
// số nhiều rẽ nhánh thủ công:
count === 1 ? t("1 report matched an existing record")
            : t("{{count}} reports matched existing records", { count })
```

### Helper thuần nhận `t` làm tham số

Để gọi được ngoài component:

```ts
export function getWasteTypeLabels(value: string | null | undefined, t: (key: string) => string): string[] { ... }
export function duplicateReasonLabel(reason: string, t: (key: string) => string): string { ... }
```

### Constants lưu label tiếng Anh CHƯA dịch

```ts
// constants/severity.ts
export const SEVERITY_LEVEL = { 1: { label: 'Low', color: 'blue', textClass: 'text-blue-600' }, ... } as const;
```

Component gọi `t(severity.label)`. Đừng dịch sẵn trong constants.

### Nội dung đa ngôn ngữ do API trả về

API trả `title_vi` / `title_en` / `description_vi`... — dùng helper, đừng tự chọn field:

```tsx
const { title: localizedTitle, description: localizedDescription } = useLocalizedDisplay();
<ReportContent title={localizedTitle(incident) || incident.title} description={localizedDescription(incident)} />
```

Nền tảng: `hooks/useLocalizedDisplay.ts` → `libs/localizedText.ts` (`pickLocalizedText`, `pickEntityTitle`). Locale gửi lên server: `libs/getApiLocale.ts` → interceptor axios.

## Enum & metadata hiển thị

Repo chỉ có 5 enum thật: `STATUS` (`constants/status.ts`, số 1–100), `PRIORITY`, `SortOrder`, `MessageType`, `MessageLevel`.

Metadata hiển thị dùng **const object + type guard**, không dùng enum:

```ts
export const SEVERITY_LEVEL = { 1: {...}, 2: {...} } as const;
export type SeverityLevelValue = keyof typeof SEVERITY_LEVEL;
export function isSeverityLevel(value: number): value is SeverityLevelValue { return value in SEVERITY_LEVEL }
export function getSeverityLevel(value?: number | string | null) { ... }
```

Có sẵn: `constants/severity.ts`, `difficulty.ts`, `priority.ts`, `gamification.ts`, `notificationPreferences.ts`.

## Toast

```ts
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t("Saved") });
```

**Không gọi `toast()` của sonner trực tiếp.**

## Icon

- `lucide-react` trong `components/ui/`.
- `react-icons` (bộ `Tb`, `Hi`, `Hi2`, `Pi`) trong code tính năng và nav admin.

## Checklist

- [ ] `cn` import từ `@/libs/utils`.
- [ ] Modal dùng shadcn `Dialog`, không dùng antd Modal.
- [ ] Nút public dùng `components/client/shared/Button`; nút admin/dialog dùng `components/ui/button`.
- [ ] Màu mới khai báo thành token trong `app/globals.css`, không hardcode hex.
- [ ] Dark mode admin dùng prop `isDark` + `cn()`, không dùng `dark:`.
- [ ] Form validate inline bằng RHF, message bọc `t()`, không thêm zod/yup.
- [ ] Mọi chuỗi mới có mặt trong **cả** `en/common.json` và `vi/common.json`.
- [ ] Không reformat toàn file — Prettier không được enforce, bám style file đang sửa.
