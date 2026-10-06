import type { IBaseResponse } from '@/types/BaseResponse';
import type { ISosDetail, ISosSummary } from '@/apis/sos/models/sos';

/**
 * Single place that maps the SOS server envelopes onto the client models, so a change in the
 * response shape (e.g. `{ sos }` wrapper, list key) is absorbed here.
 */
export const SOS_URL = '/api/v1/sos';
/** Availability ("Sẵn sàng") base path; may move on the server. */
export const SOS_AVAILABILITY_URL = '/api/v1/sos/me/availability';

type Raw = IBaseResponse<unknown>;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Accepts `data` = detail, or `data = { sos: detail }`. */
export function toSosDetailResponse(res: Raw): IBaseResponse<ISosDetail> {
  const data = res.data;
  const sos = isObject(data) && isObject(data.sos) ? data.sos : data;
  return { ...res, data: sos as unknown as ISosDetail };
}

/** Accepts an array, `{ items, total }`, `{ sos, meta }` or `{ sos, total }`. */
export function toSosListResponse(res: Raw): IBaseResponse<{ items: ISosSummary[]; total: number }> {
  const data = res.data;
  let items: ISosSummary[] = [];
  let total = 0;
  if (Array.isArray(data)) {
    items = data as ISosSummary[];
    total = items.length;
  } else if (isObject(data)) {
    const list = Array.isArray(data.items) ? data.items : Array.isArray(data.sos) ? data.sos : [];
    items = list as ISosSummary[];
    const meta = isObject(data.meta) ? data.meta : undefined;
    total = Number(data.total ?? meta?.total ?? items.length) || items.length;
  }
  return { ...res, data: { items, total } };
}

/** Accepts `data` = array or `{ items }` / `{ sos }`. */
export function toSosArrayResponse(res: Raw): IBaseResponse<ISosSummary[]> {
  return { ...res, data: toSosListResponse(res).data.items };
}
