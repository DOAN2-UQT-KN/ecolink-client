import type { IRedeemGiftRequest } from "@/apis/gift/models/gift";

export type DeliveryAddressValue = { address: string; lat: number | null; lng: number | null };

export type RedeemFormValues = {
  /** Items of the gift, 1..quantityLimit().max. */
  quantity: number;
  recipientName: string;
  /** Digits only (see utils/phone.ts); the input shows them grouped. */
  phone: string;
  location: DeliveryAddressValue;
  addressDetail: string;
  deliveryNote: string;
};

export const MAX_RECIPIENT_NAME = 100;
export const MAX_ADDRESS_DETAIL = 255;
export const MAX_DELIVERY_NOTE = 500;
/** Most items of one gift in a single order; the server enforces the same bound (spec 018). */
export const MAX_REDEEM_QUANTITY = 10;

/** Which limit stops the customer adding one more item. */
export type QuantityLimitReason = "stock" | "points" | "order";

/**
 * Most items the customer can order now: the stock, what the balance pays for, and the per-order cap.
 * `balance` is null while it loads; the server checks points anyway. On a tie stock wins, then points.
 */
export function quantityLimit({
  stock,
  balance,
  unitPoints,
}: {
  stock: number;
  balance: number | null;
  unitPoints: number;
}): { max: number; reason: QuantityLimitReason } {
  const byPoints = balance != null && unitPoints > 0 ? Math.floor(balance / unitPoints) : Infinity;
  const max = Math.max(1, Math.min(stock, byPoints, MAX_REDEEM_QUANTITY));
  const reason: QuantityLimitReason =
    stock <= max ? "stock" : byPoints <= max ? "points" : "order";
  return { max, reason };
}

export const emptyRedeemForm = (recipientName = ""): RedeemFormValues => ({
  quantity: 1,
  recipientName,
  phone: "",
  location: { address: "", lat: null, lng: null },
  addressDetail: "",
  deliveryNote: "",
});

/** Server field → form field, for mapping 400 errors back onto the inputs. */
export const REDEEM_FIELD_BY_API: Record<string, keyof RedeemFormValues> = {
  quantity: "quantity",
  phoneNumber: "phone",
  recipientName: "recipientName",
  pickupLocation: "location",
  deliveryLatitude: "location",
  deliveryLongitude: "location",
  addressDetail: "addressDetail",
  deliveryNote: "deliveryNote",
};

export function toRedeemRequest(id: string, v: RedeemFormValues): IRedeemGiftRequest {
  return {
    id,
    quantity: v.quantity,
    phoneNumber: v.phone,
    recipientName: v.recipientName.trim(),
    pickupLocation: v.location.address.trim(),
    deliveryLatitude: v.location.lat ?? NaN,
    deliveryLongitude: v.location.lng ?? NaN,
    addressDetail: v.addressDetail.trim() || null,
    deliveryNote: v.deliveryNote.trim() || null,
  };
}
