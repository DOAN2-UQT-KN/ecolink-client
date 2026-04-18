import type { IGift } from "@/apis/gift/models/gift";

export type GiftImageFormValue = "" | File | Blob | string;

export type GiftFormValues = {
  name: string;
  description: string;
  greenPoints: string;
  unlimitedStock: boolean;
  stockRemaining: string;
  isActive: boolean;
  /** New image (Blob after compress). Empty until user picks a file. */
  giftImage: GiftImageFormValue;
};

export const DEFAULT_GIFT_FORM_VALUES: GiftFormValues = {
  name: "",
  description: "",
  greenPoints: "0",
  unlimitedStock: true,
  stockRemaining: "0",
  isActive: true,
  giftImage: "",
};

export function giftToFormValues(gift: IGift): GiftFormValues {
  return {
    name: gift.name,
    description: gift.description,
    greenPoints: String(gift.greenPoints),
    unlimitedStock: gift.stockRemaining === null,
    stockRemaining:
      gift.stockRemaining === null ? "0" : String(gift.stockRemaining ?? 0),
    isActive: gift.isActive,
    giftImage: "",
  };
}
