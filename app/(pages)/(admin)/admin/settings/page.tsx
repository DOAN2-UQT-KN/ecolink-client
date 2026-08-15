import { useTranslation } from "react-i18next";

export default function AdminSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">{t("Settings")}</h1>
      <p className="text-muted-foreground text-sm">
        {t("Admin settings placeholder.")}
      </p>
    </div>
  );
}
