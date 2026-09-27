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
| **Mọi** tag / nhãn / badge trạng thái | `@/components/ui/Pill` (hoặc `StatusTag` / `TagStatus` nếu là `STATUS` số) — **không** dùng antd `Tag`, **không** tự viết `<span className="rounded-full …">`. Xem mục "Tag / Pill" |
| Số đếm (unread, số join request) | shadcn `@/components/ui/badge` |
| Bảng admin | `@/components/admin/shared/DataTable` |
| Bảng client | `@/components/client/shared/DataTable` (API kiểu antd) |

antd v6 **chỉ dùng hạn chế**: `Image` / `Image.PreviewGroup` và `Dropdown` (menu của `ChangeStatus` / `ChangePriority`). Mặc định là shadcn/Radix.

## `components/ui/` có 2 quy ước tên file

```
components/ui/
  button.tsx  dialog.tsx  field.tsx  input.tsx  select.tsx  table.tsx  tabs.tsx
  badge.tsx  skeleton.tsx  sonner.tsx  tooltip.tsx  empty.tsx  calendar.tsx ...   ← shadcn primitive, lowercase
  AppImage.tsx  Pill.tsx  StatusTag.tsx  TagStatus.tsx  ChangeStatus.tsx  ChangePriority.tsx
  RoleBadge.tsx  BlueTickBadge.tsx  FileTypeIcon.tsx  GiftCard.tsx  ClickSpark.tsx
  RichTextEditor.tsx  RichTextContent.tsx  TooltipTruncatedText.tsx ...            ← primitive riêng của app, PascalCase
```

Primitive shadcn viết theo khuôn: file lowercase, `function Component({ className, ...props })`, gắn `data-slot="x"`, biến thể bằng `cva`, gộp class bằng `cn()`, hỗ trợ `asChild` qua `Slot.Root` của `radix-ui`.

### Component có sẵn — dùng lại trước khi viết mới

| Component | Dùng cho |
|---|---|
| `components/ui/FileTypeIcon` | Icon theo `mimeType` (fallback đuôi `fileName`): PDF đỏ, ảnh xanh |
| `components/ui/RoleBadge` | Pill vai trong tổ chức (`role`), nhãn ở `ORG_ROLE_LABEL` |
| `components/ui/BlueTickBadge` | Tick xanh tổ chức; điều kiện hiện ở `isBlueTickVisible()` |
| `components/form/AutoCompleteUser` | Chọn user có sẵn hoặc nhập email mới; `isUserDisabled` quyết định ai bị chặn (mặc định chặn owner) |
| `components/form/SelectListUser` | Chọn user có sẵn trong tổ chức (`organizationId`, `value`, `onChange`) |

## Tag / Pill — một style duy nhất

Mọi tag (trạng thái, vai trò, độ ưu tiên, nhãn ngữ cảnh, loại trên bản đồ, tag trang chủ) render bằng `Pill`:

```tsx
import { Pill } from "@/components/ui/Pill";
import { StatusTag } from "@/components/ui/StatusTag";
import { GIFT_REDEEM_TONE } from "@/constants/statusTone";

<Pill tone="green">{t("Checked in")}</Pill>
<StatusTag status={record.status} isDark={isDark} />          // STATUS số → màu + nhãn tự động
<Pill tone={GIFT_REDEEM_TONE[s]}>{t(s)}</Pill>
```

Base class (đã nằm trong `Pill`, đừng chép ra ngoài): `inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium`. Mỗi tone là `bg-{c}-50 text-{c}-700 border-{c}-200` (bảng đầy đủ ở `PILL_TONE`).

| Tone | Nghĩa |
|---|---|
| `green` | xong / đồng ý / hoạt động |
| `red` | từ chối / huỷ / lỗi / bị khoá |
| `orange` | chờ xác nhận / chờ duyệt |
| `amber` | cần xử lý / bị trả lại |
| `cyan` | mới |
| `blue` | đang làm / đã xác minh |
| `neutral` | nháp / đang chờ |
| `brand` | nhãn ngữ cảnh ("Your group", "You", "Active context") |
| `lime` | obsolete |

- **Bảng màu nằm ở `constants/statusTone.ts`**: `STATUS_TONE` + `STATUS_LABEL` (và helper `statusTone()`), `PRIORITY_TONE` / `PRIORITY_LABEL`, `GIFT_REDEEM_TONE`. Trạng thái mới → thêm vào đây, **không map màu tại chỗ**.
- Enum dạng chuỗi (hồ sơ, owner, lời mời...) map sang `STATUS` qua bảng kiểu `constants/organizationApplicationStatus.ts` (`{ type: STATUS, label }` rồi đưa vào `TagStatus`), hoặc map thẳng sang `PillTone`.
- Dark mode: truyền `isDark` (Pill tự đổi sang bản dark), không dùng `dark:`.
- `ChangeStatus` / `ChangePriority` dùng `Pill` làm trigger của antd `Dropdown`; chấm màu trong menu lấy từ `PILL_DOT[tone]`, không viết mã hex.
- Ngoại lệ: **số đếm** (chấm unread, số join request trên tab, số event) dùng shadcn `Badge`, không phải Pill.

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

### Select — luôn shadcn `Select` + `Controller`

Cả repo **không còn `<select>` HTML thô**, và antd `Select` **không dùng ở đâu cả** (antd chỉ
dùng cho `Image`, `Dropdown`).

```tsx
import { Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Field>
  <FieldLabel className="text-foreground-tertiary font-display-3">
    {t("Type of organization")} <span className="text-destructive">*</span>
  </FieldLabel>
  <Controller
    name="orgType"
    control={control}
    rules={{ required: t("Type of organization is required") }}
    render={({ field }) => (
      <Select value={field.value || undefined} onValueChange={field.onChange}>
        <SelectTrigger className={cn("w-full", inputClassName)}>
          <SelectValue placeholder={t("Select a type...")} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <span className="text-sm">{t(o.label)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
  <FieldError errors={[errors.orgType]} />
</Field>
```

Bốn điểm bắt buộc:

1. **`register()` KHÔNG hoạt động với Radix Select** — phải `Controller`. Đây là lỗi hay gặp
   nhất khi đổi từ `<select>` sang.
2. **`value={field.value || undefined}`** — chuỗi rỗng phải thành `undefined` thì placeholder
   mới hiện. Đừng thêm hàng `<option value="">` như HTML thuần.
3. **`SelectTrigger` đã là `!h-[50px]`** và có sẵn viền; chỉ cần thêm `w-full` (primitive là
   `w-fit`) và chuỗi token nâu `inputClassName`. **Đừng tự đặt `h-9`** hay dựng lại viền.
4. Danh sách dài thì `SelectContent className="max-h-[300px]"`.

Select **không nằm trong form** (state cục bộ) thì bỏ `Controller`, dùng thẳng
`value` / `onValueChange`.

Ba component `components/form/SelectList{Campaign,Organization,Priority}.tsx` là loại **tự
fetch data**, controlled (`{ value, onChange, disabled, className, placeholder }`), không
RHF-aware — bind bằng `Controller` ở call site. Không có wrapper "select bound to RHF" dùng
chung; mọi chỗ đều `Controller` tại chỗ.

### Rule validation dùng chung — bám đúng giá trị có sẵn

| Trường | Rule đang dùng | Ví dụ file |
|---|---|---|
| Email (auth) | `/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/` | `SignInForm.tsx` |
| Email (hồ sơ tổ chức) | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `apply/_components/StepEmail.tsx`, `StepContact.tsx` |
| Mật khẩu | ≥ 6 (sign-in, sign-up, reset); **≥ 8 ở activate-account** (identity-service từ chối ngắn hơn) | `activate-account/page.tsx` |
| Phone | `/^[0-9+\s\-().]{7,20}$/` | `ProfileGeneralInformation.tsx`, `SOSForm.tsx` |
| URL | `/^https?:\/\/.+/i` | `StepContact.tsx` |
| OTP | `/^\d{6}$/` | `StepEmail.tsx` |
| Lý do ban / reject (admin) | bắt buộc (trim), `maxLength={5000}` | `BanUserConfirm.tsx`, `ApproveOrganizationConfirm.tsx` |

Độ dài trường phải **khớp giới hạn server** (campaign title ≤ 200, `detail_address` ≤ 255, pickup location ≤ 1000...). Thêm trường mới thì kiểm validator server trước, đừng đoán.

Giới hạn upload đang có: incident ≤ 10 ảnh `image/*` (`FileUpload`); evidence task ≤ 20 file, video ≤ 100 MB (`PopoverCreateUpdateTask`); tài liệu tổ chức PDF/JPG/PNG, ≤ 10 MB/file, tổng ≤ 5 (`StepDocuments`); chat ≤ 8 ảnh/tin (`AiChatWidget`); avatar `image/jpeg,png,webp`.

⚠️ Chỗ **còn thiếu validation** ở client (đừng coi là mẫu): tạo campaign không bắt buộc và không so sánh start/end date; hồ sơ tổ chức không bắt buộc ≥ 1 tài liệu; upload Cloudinary lỗi ở tạo incident chỉ `console.error`. Form mới phải tự validate đủ.

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

Đây là một trong số ít **ngoại lệ được gọi `axios` trực tiếp** (vì đích không phải API của mình; danh sách đủ ở skill `ecolink-api-layer`). Mọi lời gọi khác phải qua `requestApi`.

### Chọn component upload nào

| Nhu cầu | Dùng |
|---|---|
| 1 ảnh, có crop, tỉ lệ **vuông** | `components/client/shared/SingleImageFileField` — generic `<T>`, `useController` |
| 1 ảnh, có crop, tỉ lệ **khác vuông** | `SingleImageFileField` **KHÔNG làm được** — nó hardcode `aspect={1}`. Dùng component có `cropAspect` (`organizations/create/_components/OrganizationImageUpload`, `organizations/apply/_components/ApplicationImageField`) hoặc thêm prop `cropAspect` cho nó |
| Nhiều ảnh | `incidents/create/_components/FileUpload` — tối đa 10 ảnh, PreviewGroup, ô "thêm ảnh" |

Look chuẩn của khung rỗng phía client: `border-1 border-dashed border-button-accent-hover
rounded-xl` + `IoDocumentAttachOutline` màu `text-button-accent` + `Button variant="outlined-brown"`.
Preview bo `rounded-[35px]`, nút xoá đỏ ở `-top-5 -right-2` (`p-1.5 text-red-500 bg-red-100
rounded-full ... hover:bg-red-200`).

⚠️ **"Drag and drop your images" chỉ là chữ.** Cả repo không có drag-and-drop thật — grep
`onDrop` / `onDragOver` / `dataTransfer` ra **0 kết quả**. Tất cả đều là `<div onClick>` phủ lên
`<input type="file">` ẩn. Đừng đi tìm chỗ xử lý drop, và nếu cần drop thật thì đó là tính năng
mới cho toàn repo chứ không phải sửa một trang.

Hiển thị ảnh: `@/components/ui/AppImage` (shim của `next/image`, hỗ trợ `fill`, `priority`, `sizes`). Ảnh tĩnh trong `public/` tham chiếu bằng `"/ten-file.png"`.

## i18n — luật bắt buộc

1. **Mọi chuỗi hiển thị đi qua `t()`.**
2. **Key chính là câu tiếng Anh**: `t("Gift created successfully")`.
3. Thêm key mới phải sửa **cả hai** file — `i18n/locales/en/common.json` và `i18n/locales/vi/common.json`. Hai file phải luôn cùng bộ key.
4. Namespace duy nhất: `common`. Ngôn ngữ: `en` (mặc định) và `vi`.

Runtime: i18next khởi tạo cứng `lng: "en"`; `I18nProvider` đọc `localStorage["i18nextLng"]` **sau mount** rồi mới `changeLanguage` (nên render đầu luôn là tiếng Anh). Axios tự gửi `Accept-Language` và `lang` cho GET theo ngôn ngữ UI.

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

Có sẵn: `constants/severity.ts`, `difficulty.ts`, `priority.ts`, `gamification.ts`, `notificationPreferences.ts`, `organizationApplicationStatus.ts` (status hồ sơ / owner → `STATUS` + label), `apiErrorMessages.ts` (mã lỗi → câu i18n), `roles.ts` (`ADMIN_ROLE_ID`), `statusTone.ts` (màu tag). Kiểm tra ở đây trước khi khai báo hằng mới.

## Toast

```ts
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t("Saved") });
```

**Không gọi `toast()` của sonner trực tiếp.** Lưu ý `showMessage` **bỏ qua tham số `duration`** (và chỉ có `MessageType.Toast`) — truyền vào cũng không có tác dụng.

## Icon

- `lucide-react` trong `components/ui/`.
- `react-icons` (bộ `Tb`, `Hi`, `Hi2`, `Pi`) trong code tính năng và nav admin.

## Checklist

- [ ] `cn` import từ `@/libs/utils`.
- [ ] Modal dùng shadcn `Dialog`, không dùng antd Modal.
- [ ] Nút public dùng `components/client/shared/Button`; nút admin/dialog dùng `components/ui/button`.
- [ ] Màu mới khai báo thành token trong `app/globals.css`, không hardcode hex.
- [ ] Dark mode admin dùng prop `isDark` + `cn()`, không dùng `dark:`.
- [ ] Tag / nhãn dùng `Pill` / `StatusTag`, màu lấy từ `constants/statusTone.ts` — không antd `Tag`, không pill tự viết.
- [ ] Form validate inline bằng RHF, message bọc `t()`, không thêm zod/yup.
- [ ] Mọi chuỗi mới có mặt trong **cả** `en/common.json` và `vi/common.json`.
- [ ] Không reformat toàn file — Prettier không được enforce, bám style file đang sửa.
