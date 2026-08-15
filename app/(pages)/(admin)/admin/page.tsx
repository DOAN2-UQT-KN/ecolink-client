import { useTranslation } from "react-i18next";

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">{t("Admin")}</h1>
      <p className="text-muted-foreground text-sm">
        {t("Dashboard content goes here. Use the sidebar to navigate.")}
      </p>
    </div>
  );
}
