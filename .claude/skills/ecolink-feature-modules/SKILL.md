---
name: ecolink-feature-modules
description: Quy ước thư mục modules/ của ecolink-client — khi nào tách component dùng chung ra khỏi _components/, cấu trúc phẳng hay chia thư mục con, barrel export, pattern memo + props controlled. Nạp khi sửa file trong modules/, khi định tách một component để dùng lại ở nhiều trang, hoặc khi phân vân đặt component ở đâu.
---

# Feature module dùng chung — `modules/`

## Đặt component ở đâu?

| Phạm vi dùng | Nơi đặt |
|---|---|
| Chỉ một route | `app/(pages)/.../<route>/_components/` |
| Nhiều route, có logic riêng (state, hook, service) | `modules/<Name>/` |
| Primitive UI toàn app | `components/ui/` |
| Widget dùng chung phía người dùng cuối | `components/client/shared/` |
| Widget dùng chung phía quản trị | `components/admin/shared/` |

Quy tắc: **bắt đầu ở `_components/`. Chỉ chuyển sang `modules/` khi có route thứ hai thật sự cần dùng.** Đừng tách sẵn cho tương lai.

## Cấu trúc — chọn theo kích thước

### ≤ 4 file → phẳng, `index.tsx` kiêm barrel

```
modules/ReportGeneralInformation/
  index.tsx                  # component chính + re-export ở cuối file
  DuplicateReportModal.tsx
  DuplicateVerificationCell.tsx
  duplicateReasonLabel.ts

modules/ReportSummaryCard/index.tsx
modules/LeafletAddressMap.tsx        # 1 file → nằm thẳng ở modules/
```

### Lớn hơn → chia thư mục con, file entry trùng tên thư mục

```
modules/OrganizationCard/
  OrganizationCard.tsx                          # entry, KHÔNG phải index.tsx
  components/ConfirmPopoverModal.tsx
  hooks/useOrganizationCardEdit.ts
  services/buildOrganizationCardSavePayload.ts
  services/invalidateOrganizationLists.ts
  types/OrganizationCard.types.ts               # <Name>.types.ts
  utils/blobUrls.ts

modules/ReportDetailCard/
  ReportDetailCard.tsx
  components/{ReportHeader,ReportContent,ReportFooter,ReportActions}.tsx
  hooks/useReportVotes.ts
  _services/voting.service.ts                   # biến thể có gạch dưới cũng tồn tại
  utils/time.ts
```

**Không có thư mục `api/` bên trong module.** Hook gọi API luôn ở `apis/<domain>/` (skill `ecolink-api-layer`).

`services/` trong module = hàm thuần: build payload, invalidate cache, transform. Không phải HTTP.

## Barrel

Repo chỉ có **2 barrel**: `modules/ReportGeneralInformation/index.tsx` và `components/admin/shared/DataTable/index.ts`. Còn lại import deep path.

Barrel của module phẳng đặt ở **cuối `index.tsx`**:

```tsx
export { DuplicateVerificationCell } from './DuplicateVerificationCell';
export type { DuplicateVerificationCellProps } from './DuplicateVerificationCell';
export { DuplicateReportModal } from './DuplicateReportModal';
export type { DuplicateReportModalProps } from './DuplicateReportModal';
export { duplicateReasonLabel } from './duplicateReasonLabel';
```

Bên tiêu thụ import từ thư mục:

```tsx
import { SeverityCell, DuplicateVerificationCell } from '@/modules/ReportGeneralInformation';
```

## Pattern component trong module

### `memo` + named function

```tsx
export const SeverityCell = memo(function SeverityCell({
  value,
  isDark = false,
}: FieldCellProps & { value?: string | number | null }) {
  const { t } = useTranslation();
  const severity = getSeverityLevel(value);
  return (
    <TooltipTruncatedText
      text={severity ? t(severity.label) : t('N/A')}
      maxLength={CELL_MAX_LENGTH}
      className={cn('text-xs font-medium', severity?.textClass || (isDark ? 'text-zinc-200' : 'text-foreground'))}
    />
  );
});
```

`memo(function X(){})` chứ không phải `memo(() => {})` — giữ tên hàm để dễ đọc trong React DevTools.

### Props type đặt tên `<Name>Props`, export ra ngoài

```tsx
export type DuplicateReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: IDuplicateVerification[];
  openInNewTab?: boolean;
  isDark?: boolean;
  /** Called before the dialog closes. Omit to treat confirm as dismiss. */
  onConfirm?: () => void;
};
```

- **Không prefix `I`** cho props (khác với model API — model API thì có: `IIncident`, `ICreateReportRequest`).
- Modal luôn **controlled từ cha**: `open` + `onOpenChange`.
- `isDark?: boolean` để dùng được ở cả admin (nền tối) lẫn client.
- JSDoc một dòng cho prop không hiển nhiên.

### Export kép

Nhiều component trong `modules/` export **cả** named lẫn default:

```tsx
export const DuplicateReportModal = memo(function DuplicateReportModal(...) { ... });
export default DuplicateReportModal;
```

Bám theo file xung quanh.

### Hằng số cục bộ ở đầu file

```tsx
const WASTE_TYPE_LABELS: Record<string, string> = {
  household: 'Household waste',
  construction: 'Construction waste',
};
const CELL_MAX_LENGTH = 28;
```

Label để **nguyên tiếng Anh chưa dịch**, gọi `t()` lúc render.

### Hàm thuần nhận `t` làm tham số

```ts
export function getWasteTypeLabels(value: string | null | undefined, t: (key: string) => string): string[]
```

Để gọi được ngoài React (trong service, trong cột bảng).

### Chặn click lan trong bảng / card

```tsx
const stop = useCallback((e: SyntheticEvent) => { e.stopPropagation(); }, []);
const imageShield = { onClick: stop, onPointerDown: stop };
// ...
<div {...imageShield}>...</div>
```

## Các module hiện có

| Module | Dùng cho |
|---|---|
| `ReportDetailCard/` | Card chi tiết sự cố đầy đủ, kèm vote — phía client |
| `ReportSummaryCard/` | Tile sự cố rút gọn cho danh sách |
| `ReportGeneralInformation/` | Khối thông tin sự cố + UI phát hiện trùng lặp — dùng trong bảng admin |
| `OrganizationCard/` | Card tổ chức có sửa tại chỗ |
| `LeafletAddressMap.tsx` | Chọn địa chỉ trên bản đồ, dùng ở nhiều form |

## Checklist tách module mới

- [ ] Xác nhận có **ít nhất 2 route** thật sự dùng — nếu không, để ở `_components/`.
- [ ] ≤4 file → phẳng với `index.tsx` kiêm barrel; lớn hơn → `<Name>.tsx` + `components/ hooks/ services/ types/ utils/`.
- [ ] Không tạo thư mục `api/` trong module; hook API để ở `apis/`.
- [ ] Props type đặt tên `<Name>Props`, export ra ngoài, không prefix `I`.
- [ ] Modal nhận `open` / `onOpenChange` từ cha.
- [ ] Nhận `isDark?: boolean` nếu module có thể hiển thị ở khu vực admin.
- [ ] Chuỗi mới thêm vào **cả** `en/common.json` và `vi/common.json`.
- [ ] Không thêm `"use client"` (file `DuplicateReportModal.tsx` còn sót một dòng — đó là rác, đừng bắt chước).
- [ ] `npm run build` pass.
