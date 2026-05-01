"use client";

import { useTranslation } from "react-i18next";

export default function AdminGamificationConfigPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t("Config")}</h1>
      <p className="text-muted-foreground text-sm">
        {t("Gamification config admin placeholder")}
      </p>
    </div>
  );
}
