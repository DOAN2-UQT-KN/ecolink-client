/** Translate duplicate verification reason codes for display. */
export function duplicateReasonLabel(
  reason: string,
  t: (key: string) => string,
): string {
  switch (reason) {
    case "DUPLICATE_IMAGE":
      return t("Duplicate image");
    case "SAME_PLACE":
      return t("Same place");
    case "EXACT_HASH_MATCH":
      return t("Exact hash match");
    case "HIGH_IMAGE_SIMILARITY":
      return t("High image similarity");
    case "FEATURE_MATCH":
      return t("Feature match");
    default:
      return reason;
  }
}
