"use client";

import i18n from "@/i18n";
import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stored = localStorage.getItem("i18nextLng");
    const cookieMatch = document.cookie.match(/(?:^|;\s*)i18next=([^;]+)/);
    const cookieLang = cookieMatch?.[1];
    const browserLang = navigator.language?.split("-")[0];
    const htmlLang = document.documentElement.lang?.split("-")[0];

    const detected = (stored || cookieLang || browserLang || htmlLang || "en")
      .split("-")[0]
      .toLowerCase();

    const nextLang = detected === "vi" ? "vi" : "en";

    if (i18n.language !== nextLang) {
      void i18n.changeLanguage(nextLang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
