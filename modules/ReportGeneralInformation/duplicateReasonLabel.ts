/** Translate duplicate verification reason codes for display. */
export function duplicateReasonLabel(
  reason: string,
  t: (key: string) => string,
): string {
  switch (reason) {
    case "EXACT_HASH_MATCH":
      return t("Exact hash match");
    case "HIGH_IMAGE_SIMILARITY":
      return t("High image similarity");
    default:
      return reason;
  }
}
