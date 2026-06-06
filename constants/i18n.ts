export const I18N_STORAGE_KEY = "i18nextLng";

export function resolveUiLanguage(stored: string | null): "en" | "vi" {
  return stored?.split("-")[0]?.toLowerCase() === "vi" ? "vi" : "en";
}
