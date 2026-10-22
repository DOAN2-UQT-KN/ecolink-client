import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Breadcrumbs, type BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

import { PointRulesForm } from "./_components/PointRulesForm";
import { PointRuleHistoryTable } from "./_components/PointRuleHistoryTable";

export default function AdminPointRulesPage() {
  const { t } = useTranslation();
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Point rules"), path: "/admin/point-rules", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      <section className="space-y-3" aria-labelledby="point-rules-heading">
        <div className="flex items-center gap-2">
          <h2 id="point-rules-heading" className="text-lg font-semibold text-foreground">
            {t("Point rules")}
          </h2>
          <InfoTooltip
            content={t(
              "Changes apply to the next points credited; points already credited stay as they are. Set 0 to turn a source off.",
            )}
          />
        </div>
        <PointRulesForm />
      </section>
      <section className="space-y-3" aria-labelledby="point-rules-history-heading">
        <h2 id="point-rules-history-heading" className="text-lg font-semibold text-foreground">
          {t("Change history")}
        </h2>
        <PointRuleHistoryTable />
      </section>
    </div>
  );
}
