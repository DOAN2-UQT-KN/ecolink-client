"use client";

import { useTranslation } from "react-i18next";

export default function AdminGamificationSeasonPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t("Season")}</h1>
      <p className="text-muted-foreground text-sm">
        {t("Gamification season admin placeholder")}
      </p>
    </div>
  );
}
