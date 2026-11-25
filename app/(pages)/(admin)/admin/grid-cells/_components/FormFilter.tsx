import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GridCellSort } from "@/apis/grid-cell/models/gridCell";
import { useGridCellContext } from "../_context/GridCellContext";

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useGridCellContext();

  const sortOptions: { label: string; value: GridCellSort }[] = [
    { label: t("Most reports"), value: "submitted" },
    { label: t("Most verified reports"), value: "verified" },
    { label: t("Latest report"), value: "last_report" },
    { label: t("Latest cleanup"), value: "last_cleaned" },
    { label: t("Most cleanups"), value: "cleanup" },
  ];

  return (
    <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t("Sort by")}
          </FieldLabel>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onFilterChange({ sort: value as GridCellSort })
            }
          >
            <SelectTrigger className="!h-10 w-full !border !border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t("Minimum reports")}
          </FieldLabel>
          <Input
            type="number"
            min={0}
            className="h-10 !border !border-input"
            value={filters.minReports}
            onChange={(e) =>
              onFilterChange({
                minReports: Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t("Cleanup history")}
          </FieldLabel>
          <Select
            value={filters.onlyCleaned ? "cleaned" : "all"}
            onValueChange={(value) =>
              onFilterChange({ onlyCleaned: value === "cleaned" })
            }
          >
            <SelectTrigger className="!h-10 w-full !border !border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All")}</SelectItem>
              <SelectItem value="cleaned">{t("Cleaned at least once")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}
