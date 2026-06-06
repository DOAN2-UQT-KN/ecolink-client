"use client";

import i18n from "@/i18n";
import { I18N_STORAGE_KEY, resolveUiLanguage } from "@/constants/i18n";
import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    const nextLang = resolveUiLanguage(stored);

    if (!stored) {
      localStorage.setItem(I18N_STORAGE_KEY, nextLang);
    }

    if (i18n.language !== nextLang) {
      void i18n.changeLanguage(nextLang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
