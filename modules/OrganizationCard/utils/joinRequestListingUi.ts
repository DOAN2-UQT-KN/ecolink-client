import { STATUS } from "@/constants/status";

export function joinListingShowsJoinButton(
  requestStatus: number | null | undefined,
): boolean {
  return (
    requestStatus === 0 ||
    requestStatus === undefined ||
    requestStatus === null
  );
}

export function joinListingShowsCancelButton(
  requestStatus: number | null | undefined,
): boolean {
  return requestStatus === STATUS.PENDING;
}
