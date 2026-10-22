import type { IUpdateGiftRedemptionStatusRequest } from "@/apis/gift/models/gift";
import { CARRIER_SUGGESTIONS, OTHER_CARRIER } from "../_config/carriers";

export const MAX_CANCEL_REASON = 500;

export type CancelFormValues = {
  reason: string;
  /** Asked only for a SHIPPED order: did the item come back? */
  restock: "" | "yes" | "no";
};

export const EMPTY_CANCEL_FORM: CancelFormValues = { reason: "", restock: "" };

/** A PROCESSING order always goes back to stock on the server, so restock is sent only for SHIPPED. */
export function toCancelPayload(
  id: string,
  shipped: boolean,
  values: CancelFormValues,
): IUpdateGiftRedemptionStatusRequest {
  return {
    id,
    status: "CANCELLED",
    cancelReason: values.reason.trim(),
    ...(shipped ? { restock: values.restock === "yes" } : {}),
  };
}

export const MAX_CARRIER = 100;
/** Same rule as the server: 1–100 of A-Z a-z 0-9 . _ / - */
export const TRACKING_CODE_PATTERN = /^[A-Za-z0-9._/-]{1,100}$/;

export type ShipFormValues = {
  /** A listed carrier or OTHER_CARRIER. */
  carrierChoice: string;
  /** Typed name, used only when carrierChoice is OTHER_CARRIER. */
  otherCarrier: string;
  trackingCode: string;
};

/** Edit mode starts from the saved carrier: a listed one is selected, anything else goes to "Other". */
export function toShipForm(carrier: string | null, trackingCode: string | null): ShipFormValues {
  const listed = (CARRIER_SUGGESTIONS as readonly string[]).includes(carrier ?? '');
  return {
    carrierChoice: carrier ? (listed ? carrier : OTHER_CARRIER) : '',
    otherCarrier: carrier && !listed ? carrier : '',
    trackingCode: trackingCode ?? '',
  };
}

export function toShipFields(values: ShipFormValues): { carrier: string; trackingCode: string } {
  const carrier = values.carrierChoice === OTHER_CARRIER ? values.otherCarrier : values.carrierChoice;
  return { carrier: carrier.trim(), trackingCode: values.trackingCode.trim() };
}
