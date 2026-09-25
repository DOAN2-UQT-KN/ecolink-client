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

`organization-application` là domain duy nhất có endpoint **công khai, không cần đăng nhập** (form nộp hồ sơ tổ chức). Nó xác thực bằng header `x-submission-token` lấy từ OTP email, và prefix `/api/v1/organization-applications` nằm trong `PUBLIC_AUTH_PATHS` của `libs/axiosClient.ts` để 401 không đá khách ẩn danh về `/sign-in`.

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

- `const url = "/api/v1/..."` khai báo ở đầu module, **không inline** trong hàm.
- Export **cả** hàm async trần **và** hook `use*`. Hàm trần để gọi ngoài React (service, context), hook để dùng trong component.
- `...options` spread **cuối cùng** để caller override được `onSuccess`, `enabled`, `messageSuccess`...
- Query: `options?: Omit<UseGetOptions<TResponse>, "queryKey" | "queryFn">`.
- Mutation: `options?: UsePostOptions<TResponse, TRequest>`.
- `import { useGet, UseGetOptions }` — value import, không dùng `import type` (bám theo code hiện có).
- Mutation có id + body dùng **một object arg**: `updateGift({ id, data })`.

## `usePost` là lối vào duy nhất cho MỌI mutation

Kể cả PUT / PATCH / DELETE — tên hook là `usePost` nhưng `mutationFn` gọi verb nào cũng được.

`hooks/reactQuery.ts` lo sẵn 3 việc:

1. **Toast** — `messageSuccess.content` có giá trị thì bắn toast success; lỗi thì bắn toast error (trừ khi `silentError: true`). Nội dung lỗi ưu tiên `error.errors[0].message`.
2. **401** — tự `setLogoutSuccess()` và xoá cookie `refresh_token`.
3. **Invalidate** — `queryKey` truyền vào sẽ được `cancelQueries` ở `onMutate` và `invalidateQueries` ở `onSettled`.

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
```

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
- Request interceptor gắn `Authorization: Bearer`, `X-Refresh-Token`, `Accept-Language`, và **chèn `params.lang` vào mọi GET**.
- `paramsSerializer` dùng `query-string` với `arrayFormat: "comma"` → mảng serialize thành `a,b,c`.
- Timeout 120000.
- **Lỗi được bóc trước khi reject** — consumer nhận **body của API**, không phải `AxiosError`:

```ts
QueryError = {
  message: string;
  success: boolean;
  errors?: { message: string; extensions?: { code?: string; status_code?: number } }[];
}
```

- 401 → gọi `axios.post` thô (không qua instance, tránh loop) tới `/api/v1/auth/refresh-token`, cập nhật store + cookie, retry 1 lần; thất bại thì logout + redirect `/sign-in?redirect=...`.
- `PUBLIC_AUTH_PATHS` được loại khỏi luồng refresh.

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
