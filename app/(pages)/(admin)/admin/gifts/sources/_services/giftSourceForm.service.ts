import type { GiftSourceType, IGiftSource, IGiftSourceBody } from "@/apis/gift-source/models/giftSource";

export const GIFT_SOURCE_TYPES: GiftSourceType[] = ["SPONSOR", "ECOLINK", "DONATION"];

export const GIFT_SOURCE_TYPE_LABEL: Record<GiftSourceType, string> = {
  SPONSOR: "Sponsor",
  ECOLINK: "Bought by Ecolink",
  DONATION: "Donation",
};

export const PHONE_PATTERN = /^[0-9+\-()\s.]{7,32}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GiftSourceFormValues = {
  name: string;
  type: GiftSourceType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  showOnGift: boolean;
  note: string;
  /** New logo file; empty keeps the current one. */
  logo: "" | File | Blob | string;
  removeLogo: boolean;
};

export const DEFAULT_GIFT_SOURCE_FORM_VALUES: GiftSourceFormValues = {
  name: "",
  type: "SPONSOR",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  showOnGift: false,
  note: "",
  logo: "",
  removeLogo: false,
};

export function sourceToFormValues(source: IGiftSource): GiftSourceFormValues {
  return {
    name: source.name,
    type: source.type,
    contactName: source.contactName ?? "",
    contactPhone: source.contactPhone ?? "",
    contactEmail: source.contactEmail ?? "",
    showOnGift: source.showOnGift,
    note: source.note ?? "",
    logo: "",
    removeLogo: false,
  };
}

/** Body for create/update; `logoUrl` is set only when the logo changes ("" removes it). */
export function toGiftSourceBody(values: GiftSourceFormValues, uploadedLogoUrl: string | null): IGiftSourceBody {
  return {
    name: values.name.trim(),
    type: values.type,
    contactName: values.contactName.trim() || null,
    contactPhone: values.contactPhone.trim() || null,
    contactEmail: values.contactEmail.trim() || null,
    showOnGift: values.showOnGift,
    note: values.note.trim() || null,
    ...(uploadedLogoUrl ? { logoUrl: uploadedLogoUrl } : values.removeLogo ? { logoUrl: "" } : {}),
  };
}
