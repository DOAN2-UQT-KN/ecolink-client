import type { StockAdjustReason } from "@/apis/gift-source/models/giftSource";
import type { ICreateStockBatchRequest, StockMovementType } from "@/apis/gift-stock/models/stock";

export const ADJUST_REASONS: StockAdjustReason[] = ["DAMAGED", "LOST", "COUNT_SHORTAGE", "RETURN_TO_SOURCE"];

export const ADJUST_REASON_LABEL: Record<StockAdjustReason, string> = {
  DAMAGED: "Damaged",
  LOST: "Lost",
  COUNT_SHORTAGE: "Count shortage",
  RETURN_TO_SOURCE: "Returned to source",
};

export const MOVEMENT_TYPES: StockMovementType[] = ["STOCK_IN", "REDEEM_OUT", "CANCEL_RETURN", "ADJUST_OUT", "EXPIRED"];

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  STOCK_IN: "Stock received",
  REDEEM_OUT: "Redeemed",
  CANCEL_RETURN: "Order cancelled, item returned",
  ADJUST_OUT: "Written off",
  EXPIRED: "Expired",
};

export type StockInFormValues = {
  sourceId: string;
  quantity: string;
  unitValueVnd: string;
  /** yyyy-MM-dd from a date input */
  receivedAt: string;
  expiresAt: string;
  reference: string;
  note: string;
};

/** Today in UTC+7 as yyyy-MM-dd (the date input's format). */
export const todayVn = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const defaultStockInValues = (): StockInFormValues => ({
  sourceId: "",
  quantity: "",
  unitValueVnd: "0",
  receivedAt: todayVn(),
  expiresAt: "",
  reference: "",
  note: "",
});

export const isWholeNumber = (v: string, min: number) => /^\d+$/.test(v.trim()) && Number(v) >= min;

/** "23000" → "23.000" for display; the form keeps the digits only. */
export const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const digitsOnly = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

export const MAX_PROOF_FILES = 5;
export const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;
/** Cloudinary's image upload also takes PDFs, so proofs are images or PDFs. */
export const PROOF_FILE_ACCEPT = "image/*,application/pdf";
export const isProofFileType = (f: File) => f.type.startsWith("image/") || f.type === "application/pdf";

/**
 * Dates are calendar days in UTC+7. A batch received today is stamped "now" (the server refuses
 * future times); an expiry date means the end of that day.
 */
export function toStockInRequest(values: StockInFormValues, attachmentUrls: string[]): ICreateStockBatchRequest {
  const receivedAt =
    values.receivedAt === todayVn() ? new Date().toISOString() : new Date(`${values.receivedAt}T00:00:00+07:00`).toISOString();
  return {
    sourceId: values.sourceId,
    quantity: Number(values.quantity),
    unitValueVnd: Number(values.unitValueVnd),
    receivedAt,
    expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59+07:00`).toISOString() : null,
    reference: values.reference.trim(),
    attachmentUrls,
    note: values.note.trim() || null,
  };
}
