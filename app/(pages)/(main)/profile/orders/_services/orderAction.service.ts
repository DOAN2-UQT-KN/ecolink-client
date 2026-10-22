import type { ICancelMyRedemptionRequest } from '@/apis/gift/models/gift';
import type { QueryError } from '@/hooks/reactQuery';

export const MAX_CANCEL_REASON = 500;

/** Quick picks shown above the reason box; the translated text becomes the reason (still editable). */
export const CANCEL_REASON_OPTIONS = [
  'I picked the wrong gift',
  'I want a different gift',
  'My delivery details are wrong',
  'I no longer need this gift',
] as const;

export function toCancelRequest(code: string, reason: string): ICancelMyRedemptionRequest {
  return { code, cancelReason: reason.trim() };
}

/** The order moved on (shipped, cancelled, delivered) between loading the page and acting. */
export const isStaleOrderError = (error: unknown) => (error as QueryError | undefined)?.status === 422;
