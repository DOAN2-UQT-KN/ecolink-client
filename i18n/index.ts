import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import viCommon from "./locales/vi/common.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
      },
      vi: {
        common: viCommon,
      },
    },

    // Keep initial language deterministic for SSR hydration.
    lng: "en",
    fallbackLng: "en",

    ns: ["common"],
    defaultNS: "common",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
