"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { resolveUiLanguage } from "@/constants/i18n";
import {
  pickEntityDescription,
  pickEntityTitle,
  type AppLocale,
  type LocalizableEntity,
} from "@/libs/localizedText";

export function useLocalizedDisplay() {
  const { i18n } = useTranslation();
  const locale = resolveUiLanguage(i18n.language) as AppLocale;

  return useMemo(
    () => ({
      locale,
      title: (entity: LocalizableEntity) => pickEntityTitle(entity, locale),
      description: (entity: LocalizableEntity) =>
        pickEntityDescription(entity, locale),
    }),
    [locale],
  );
}
