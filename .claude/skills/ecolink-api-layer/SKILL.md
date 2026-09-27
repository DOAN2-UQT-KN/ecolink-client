---
name: ecolink-api-layer
description: Tầng gọi API của ecolink-client — apis/<domain>/<verb><Noun>.ts, requestApi, useGet/usePost, quy ước queryKey, IBaseResponse/IPaginationResponse, toast và xử lý 401 tự động. Nạp khi thêm hoặc sửa endpoint, khi viết mutation, khi cần invalidate cache, hoặc khi đang làm việc trong thư mục apis/.
---

# Tầng API — ecolink-client

## 4 lớp

```
libs/axiosClient.ts      # instance axios: baseURL, interceptor token/refresh/401, serialize params
      ↓
utils/requestApi.ts      # wrapper theo verb, trả thẳng res.data
      ↓
hooks/reactQuery.ts      # useGet / usePost — toast, 401 logout, invalidate tự động
      ↓
apis/<domain>/<verb><Noun>.ts   # 1 file = 1 endpoint, export cả raw fn lẫn hook
```

**Không bao giờ gọi `axios` trực tiếp trong component.** Luôn đi qua `requestApi` + `useGet`/`usePost`.

Ngoại lệ đã có (đích không phải API của mình, hoặc cần stream) — đừng thêm chỗ mới ngoài danh sách này:

| Lời gọi trực tiếp | File |
|---|---|
| Upload Cloudinary (axios thô) | `incidents/create/_services/upload.service.ts > uploadToCloudinary()` |
| Upload file lên presigned URL (axios thô, cố ý bỏ interceptor) | `apis/organization-application/presignDocument.ts > uploadApplicationDocument()` |
| SSE chat AI (`fetch`) | `components/client/ai-chat/aiChatClient.ts` |
| Nominatim geocoding (`fetch`) | `ApplicationAddress`, `ProfileLocationSection`, `LeafletAddress`, `Address`, `AddressPickerCard` — cần địa chỉ thì **dùng lại các component này** |

## Cấu trúc `apis/`

```
apis/
  gift/
    models/gift.ts          # IGift, IGetGiftsRequest, IGetGiftsResponse, ICreateGiftRequest...
    getGifts.ts
    createGift.ts
    updateGift.ts
    redeemGift.ts
    getGiftRedemptions.ts
    adminGiftRedemptions.ts
```

Domain hiện có: `auth`, `campaign`, `incident`, `organization`, `organization-application`, `gift`, `points`, `notification`, `sos`, `vote`, `user`, `saved-resource`, `chat-media`, `admin-media`.

Endpoint **công khai, không cần đăng nhập**, nằm trong `PUBLIC_AUTH_PATHS` của `libs/axiosClient.ts` (so khớp `url.includes`) để 401 không đá khách ẩn danh về `/sign-in`:

- `/api/v1/organization-applications` — form nộp hồ sơ tổ chức, gồm cả `owner-confirmations/:token`. Xác thực bằng **query `?token=<tracking_token>`** (helper `withToken()` trong `saveApplication.ts`), **không phải header**. Token lấy từ bước OTP email.
- `/api/v1/organization-invitations` — link mời thành viên mở từ email (`/:token`, `/accept`, `/decline`).
- Các path `/api/v1/auth/*` công khai (sign-in, sign-up, refresh-token, reset...).

Thêm endpoint công khai mới (mở từ email, không login) thì phải thêm prefix vào `PUBLIC_AUTH_PATHS`, nếu không 401 sẽ xoá phiên và đá người dùng đi.

Endpoint chỉ dành cho admin (enforcement ở server): `apis/incident/verifyReport.ts`, `apis/incident/banReport.ts`, `apis/user/banUser.ts`, `apis/campaign/processCampaign.ts`, `apis/gift/adminGiftRedemptions.ts`, `apis/gift/createGift.ts`, `apis/gift/updateGift.ts`, `apis/admin-media/registerAdminMedia.ts`.

## Template — file query

`apis/gift/getGifts.ts` (nguyên văn):

```ts
import requestApi from "@/utils/requestApi";
import type { IGetGiftsRequest, IGetGiftsResponse } from "@/apis/gift/models/gift";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/gifts";

export const getGifts = async (req: IGetGiftsRequest): Promise<IGetGiftsResponse> => {
  return await requestApi.get<IGetGiftsResponse>(url, req);
};

export const useGetGifts = (
  req: IGetGiftsRequest,
  options?: Omit<UseGetOptions<IGetGiftsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gifts", req],
    queryFn: () => getGifts(req),
    ...options,
  });
};
```

## Template — file mutation

`apis/gift/createGift.ts` (nguyên văn):

```ts
import requestApi from "@/utils/requestApi";
import type { ICreateGiftRequest, ICreateGiftResponse } from "@/apis/gift/models/gift";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/gifts";

export const createGift = async (data: ICreateGiftRequest): Promise<ICreateGiftResponse> => {
  return await requestApi.post<ICreateGiftResponse>(url, data);
};

export const useCreateGift = (
  options?: UsePostOptions<ICreateGiftResponse, ICreateGiftRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createGift,
    queryKey: ["gifts"],
    messageSuccess: { content: t("Gift created successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
```

### Quy tắc bắt buộc

- `const url = "/api/v1/..."` khai báo ở đầu module, **không inline** trong hàm. Path **luôn bắt đầu bằng `/api/v1/`** (có `/` đầu).
- Export **cả** hàm async trần **và** hook `use*`. Hàm trần để gọi ngoài React (service, context), hook để dùng trong component.
- `...options` spread **cuối cùng** để caller override được `onSuccess`, `enabled`, `messageSuccess`...
- Query: `options?: Omit<UseGetOptions<TResponse>, "queryKey" | "queryFn">`.
- Mutation: `options?: UsePostOptions<TResponse, TRequest>`.
- `import { useGet, UseGetOptions }` — value import, không dùng `import type` (bám theo code hiện có).
- Mutation có id + body dùng **một object arg**: `updateGift({ id, data })`.

### ⚠️ File lỗi đã biết — không chép theo

| File | Vấn đề |
|---|---|
| `apis/auth/googleSignIn.ts`, `googleCallback.ts` | Path `/auth/oauth/google...` thiếu `/api/v1`, gateway không proxy |
| `apis/auth/signOut.ts` | `/api/v1/auth/sign-out` — server chỉ có `/logout`, lỗi bị nuốt |
| `apis/organization/getOwnedOrganizations.ts` | `/organizations/owned` không tồn tại (UNUSED) |
| `apis/incident/deleteReportMedia.ts` | Thiếu `/:mediaFileId` (UNUSED) |
| `apis/organization/joinRequest.ts`, `apis/saved-resource/getSavedResource.ts` | Path thiếu `/` đầu (`api/v1/...`) |

Hàm trùng tên / chết dễ import nhầm: `useGetMyJoinRequests` có ở cả `apis/campaign/joinCampaign.ts` lẫn `apis/organization/joinRequest.ts`; `getMembersByOrg` / `getJoinRequestsByOrg` có cả file riêng lẫn trong `organizationById.ts` (bản đang dùng); `createJoinRequest` trùng `createOrganizationJoinRequest`. Kiểm tra call site hiện có trước khi import.

Key trong body **không đồng nhất** giữa các API cũ (`{ requestId }` ở campaign vs `{ request_id }` ở organization; `rejectReason` ở completion-review vs `reject_reason` ở chỗ khác). Endpoint mới: bám đúng tên field server khai báo, đừng suy từ file bên cạnh.

## `usePost` là lối vào duy nhất cho MỌI mutation

Kể cả PUT / PATCH / DELETE — tên hook là `usePost` nhưng `mutationFn` gọi verb nào cũng được.

`hooks/reactQuery.ts` lo sẵn 3 việc:

1. **Toast** — `messageSuccess.content` có giá trị thì bắn toast success; lỗi thì bắn toast error (trừ khi `silentError: true`). Nội dung lỗi lấy theo thứ tự: `apiErrorMessage(error, t)` (map mã lỗi) → `error.errors[0].message` → `messageError.content` → `error.message`.
2. **401** — tự `setLogoutSuccess()` và xoá cookie `refresh_token` (không redirect).
3. **Invalidate** — `queryKey` truyền vào sẽ được `cancelQueries` ở `onMutate` và `invalidateQueries` ở `onSettled`.

⚠️ Bẫy cần tránh:
- `usePost` coi là 401 cả khi **`error.message` chứa chuỗi `"401"`** → message lỗi nghiệp vụ có số 401 sẽ đăng xuất người dùng. Đừng để server/client đặt message chứa "401".
- **`useGet` không bắn toast** (nhận `silentError`/`messageError` nhưng bỏ qua). Component phải tự render trạng thái `isError`.

### Thêm mã lỗi mới

Map mã lỗi server → câu tiếng Anh trong `constants/apiErrorMessages.ts > API_ERROR_MESSAGES` (placeholder `{{email}}` lấy phần sau `": "` của message), rồi thêm câu đó làm key i18n vào **cả** `en/common.json` lẫn `vi/common.json`. Đừng so `error.code` ở từng component.

⇒ Trong component, `catch {}` để trống là đúng pattern — lỗi đã được hiển thị:

```tsx
try {
  await createMutation.mutateAsync(payload);
} catch {
  // usePost surfaces API errors.
}
```

## Quy ước `queryKey`

Tuple string thuần. Resource số nhiều trước, object params sau. **Không có key factory.**

```
["gifts", req]                    ["gifts"]
["users", req]                    ["incidents", req]
["reports", params]               ["my-reports", params]        ["all-reports", params]
["report-detail", id]             ["campaign", id]              ["campaigns", params]
["my-campaigns", params]          ["organizations", req]        ["organization", id]
["organization-by-slug", slug]    ["organization-members", id, req]
["organization-join-requests", id, req]
["organization-applications", req]                 ["organization-application", id, token]
["organization-application-admin", id]
["gift-redemptions", "me", req]   ["gift-redemptions", "admin", req]
["points", req]                   ["point-transactions", req]
["sos", params]                   ["saved-resources", params]
["all-campaigns", params]         ["campaign-tasks", params]    ["campaign-volunteers", params]
["campaign-managers", params]     ["campaign-join-requests", params]
["my-campaign-join-requests", params]                            ["my-join-requests", req]
["my-organizations", req]         ["organization-user-search", orgId, q]
["organization-invitations", orgId, status ?? "all"]             ["organization-invitation", token]
["owner-confirmation", token]     ["application-email-link", req]
```

Invalidate theo **prefix**: `["campaign-tasks"]` khớp mọi `["campaign-tasks", params]`. Grep `queryKey` trong `apis/` trước khi đặt key mới để không trùng.

Polling hiện có: `NotificationMenu` dùng `refetchInterval: 20_000`; `/maps` dùng `setInterval` 10 s gọi thẳng hàm thô (ngoài React Query). Polling mới ưu tiên `refetchInterval` của `useGet`.

## Invalidate cache — 3 cách hợp lệ

1. **Khai báo (ưu tiên)** — truyền `queryKey` cho `usePost`, nó tự invalidate ở `onSettled`.
2. **Trong hook / component** — `const queryClient = useQueryClient(); await queryClient.invalidateQueries({ queryKey: ["reports"] });` (xem `modules/ReportDetailCard/hooks/useReportVotes.ts`).
3. **Ngoài React** — import singleton: `import { queryClient } from "@/libs/queryClient";` (xem `app/(pages)/(main)/incidents/create/_context/IncidentContext.tsx` invalidate `['incidents']`, `['all-reports']`, `['my-reports']` sau khi tạo).

Khi nhiều nơi cần cùng một bộ invalidate, tách helper: `modules/OrganizationCard/services/invalidateOrganizationLists.ts`.

## Kiểu response

Chỉ có 2 envelope, ở `types/`:

```ts
// types/BaseResponse.ts
export interface IBaseResponse<T = unknown> {
  success: boolean; code?: string; message?: string; data: T;
}

// types/PaginationResponse.ts — generic thứ 2 đặt TÊN KEY của collection
export interface IPaginationResponse<T = unknown, K extends string = 'items'> {
  success: boolean; code?: string; message?: string;
  data: { [key in K]: T } & { total: number; page: number; limit: number };
}
```

Model dựng từ đó:

```ts
export type IGetReportsResponse = IPaginationResponse<IIncident[], "reports">;
export type ICreateReportResponse = IBaseResponse<{ report: IIncident }>;
```

`useGet` / `usePost` đều ràng buộc `TResponse extends IBaseResponse` — response mới phải khớp envelope.

Đặt tên: `I<Verb><Entity>Request` / `I<Verb><Entity>Response`, để trong `apis/<domain>/models/<name>.ts`.

## `libs/axiosClient.ts` — những điều cần biết

- `baseURL` từ `import.meta.env.VITE_API_URL`, fallback `window.location.origin`.
- Request interceptor gắn `Authorization: Bearer`, `X-Refresh-Token`, `Accept-Language`, và **chèn `params.lang` vào mọi GET** — đã tự động, đừng tự thêm `lang` hay `X-Refresh-Token` vào request.
- `paramsSerializer` dùng `query-string` với `arrayFormat: "comma"` → mảng serialize thành `a,b,c`.
- Timeout 120000.
- **Lỗi thường được bóc trước khi reject** — consumer nhận **body của API** (kèm `status`), không phải `AxiosError`:

```ts
QueryError = {
  message: string;
  success: boolean;
  errors?: { message: string; extensions?: { code?: string; status_code?: number } }[];
}
```

  ⚠️ Ngoại lệ: **response 404** (hoặc `response.data` không phải object) reject **nguyên `AxiosError`** → `errors` không có, toast hiện message mặc định của axios. Xử lý 404 thì kiểm cả hai dạng.
- 401 → gọi `axios.post` thô (không qua instance, tránh loop) tới `/api/v1/auth/refresh-token`, cập nhật store + cookie, retry 1 lần; thất bại thì logout + redirect `/sign-in?redirect=...`.
- **Refresh không có hàng đợi/khoá**: nhiều request 401 cùng lúc sẽ refresh song song. Đừng bắn loạt request cần auth song song khi không cần.
- `PUBLIC_AUTH_PATHS` được loại khỏi luồng refresh.

## Quyền: 3 nguồn

| Nguồn | Lấy từ | Ví dụ |
|---|---|---|
| Nền tảng | `useAuthStore` → `user.roleId === ADMIN_ROLE_ID` | chỉ để ẩn link Admin |
| Tổ chức | API trả `organization.my_role` + `organization.permissions.*` | `can_edit_org`, `can_invite`, `can_approve_members`, `can_propose_owners` |
| Chiến dịch | API trả cờ trên campaign | `can_manage_campaign`, owner = `campaign.owner.id` |

`useOrgContextStore.activeOrganizationId` **chỉ để hiển thị** (highlight, switcher), không gửi lên server và không cấp quyền gì. Server kiểm quyền theo DB mỗi request.

## `libs/queryClient.ts`

`staleTime: 5 phút`, `refetchOnWindowFocus: false`, `retry: 1`. Hàm `handleGlobalError` hiện là **stub rỗng** — đừng trông cậy vào nó.

## Toast

```ts
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

showMessage({
  type: MessageType.Toast,
  level: MessageLevel.Success,
  title: t("Report verified successfully"),
});
```

`showMessage` là **default export**. `MessageLevel`: `Info | Success | Warning | Error`. **Không gọi `toast()` của sonner trực tiếp.** `<Toaster />` đã mount một lần ở `src/layouts/RootLayout.tsx`.

## Checklist thêm endpoint mới

- [ ] Thêm `I<Verb><Entity>Request` / `Response` vào `apis/<domain>/models/<name>.ts`, dựng từ `IBaseResponse` hoặc `IPaginationResponse`.
- [ ] Tạo `apis/<domain>/<verb><Entity>.ts`: `const url`, hàm async trần, hook `use*`.
- [ ] Query → `useGet` + `queryKey: ["<resource>", req]`.
- [ ] Mutation → `usePost` + `mutationFn` + `queryKey` để invalidate + `messageSuccess`/`messageError`.
- [ ] `...options` spread cuối cùng.
- [ ] Chuỗi trong `messageSuccess` bọc `t()` và thêm key vào **cả** `en/common.json` lẫn `vi/common.json`.
