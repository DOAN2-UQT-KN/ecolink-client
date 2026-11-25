import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { useParams } from "@/libs/router";
import { GridCellDetail } from "../_components/GridCellDetail";

export default function AdminGridCellDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const cellKey = decodeURIComponent(String(params.cellKey ?? ""));

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Grid cells"), path: "/admin/grid-cells", type: "link" },
      { label: cellKey, path: `/admin/grid-cells/${cellKey}`, type: "page" },
    ],
    [cellKey, t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      <GridCellDetail cellKey={cellKey} />
    </div>
  );
}
