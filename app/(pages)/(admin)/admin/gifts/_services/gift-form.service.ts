import type { IGift } from "@/apis/gift/models/gift";

export type GiftImageFormValue = "" | File | Blob | string;

export type GiftFormValues = {
  name: string;
  description: string;
  greenPoints: string;
  isActive: boolean;
  /** New image (Blob after compress). Empty until user picks a file. */
  giftImage: GiftImageFormValue;
};

export const DEFAULT_GIFT_FORM_VALUES: GiftFormValues = {
  name: "",
  description: "",
  greenPoints: "0",
  isActive: true,
  giftImage: "",
};

export function giftToFormValues(gift: IGift): GiftFormValues {
  return {
    // name/description come back null from the server; edit the stored source text.
    name: gift.name ?? gift.nameVi ?? gift.nameEn ?? "",
    description: gift.description ?? gift.descriptionVi ?? gift.descriptionEn ?? "",
    greenPoints: String(gift.greenPoints),
    isActive: gift.isActive,
    giftImage: "",
  };
}
