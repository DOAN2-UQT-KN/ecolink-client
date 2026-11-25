import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useRecomputeGridCells } from "@/apis/grid-cell/recomputeGridCells";

import { GridCellProvider } from "./_context/GridCellContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { GridCellMap } from "./_components/GridCellMap";

function GridCellsContent() {
  const { t } = useTranslation();
  const { mutate: recompute, isPending } = useRecomputeGridCells();
  const [view, setView] = useState<"map" | "table">("map");

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Grid cells"), path: "/admin/grid-cells", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => recompute()}
        >
          {t("Recompute all cells")}
        </Button>
      </div>

      <div className="inline-flex rounded-md border border-border p-0.5">
        {(["map", "table"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={
              view === v
                ? "rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                : "rounded px-3 py-1 text-sm text-foreground-secondary"
            }
          >
            {v === "map" ? t("Map") : t("Table")}
          </button>
        ))}
      </div>

      {view === "map" ? (
        <GridCellMap />
      ) : (
        <>
          <FormFilter />
          <DataTable />
        </>
      )}
    </div>
  );
}

export default function AdminGridCellsPage() {
  return (
    <GridCellProvider>
      <GridCellsContent />
    </GridCellProvider>
  );
}
