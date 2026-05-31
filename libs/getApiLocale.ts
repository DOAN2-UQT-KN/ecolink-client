import { I18N_STORAGE_KEY, resolveUiLanguage } from "@/constants/i18n";
import type { AppLocale } from "@/libs/localizedText";

/** Current UI language from localStorage (client-only). */
export function getApiLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "en";
  }
  return resolveUiLanguage(localStorage.getItem(I18N_STORAGE_KEY));
}

export function acceptLanguageHeader(locale: AppLocale): string {
  return locale === "vi"
    ? "vi-VN,vi;q=0.9,en;q=0.8"
    : "en-US,en;q=0.9,vi;q=0.8";
}
