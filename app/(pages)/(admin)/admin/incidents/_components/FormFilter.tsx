"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbZoom } from "react-icons/tb";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { STATUS } from "@/constants/status";
import { useIncidentContext } from "../_context/IncidentContext";

type FormFieldConfig = {
  key: string;
  label: string;
  render: () => React.ReactNode;
};

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useIncidentContext();
  const values = filters;
  const [searchInput, setSearchInput] = useState(values.search);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setSearchInput(values.search);
  }, [values.search]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== values.search) {
      onFilterChange({ search: next });
    }
  }, [debouncedSearch, onFilterChange, values.search]);

  const formFields: FormFieldConfig[] = useMemo(() => {
    const statusOptions = [
      { label: t("All"), value: "all" },
      { label: t("Draft"), value: String(STATUS.DRAFT) },
      { label: t("Pending"), value: String(STATUS.PENDING) },
      { label: t("Inactive"), value: String(STATUS.INACTIVE) },
      { label: t("In progress"), value: String(STATUS.IN_PROGRESS) },
      { label: t("Completed"), value: String(STATUS.COMPLETED) },
    ];

    return [
      {
        key: "search",
        label: t("Search"),
        render: () => (
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-10 !border !border-zinc-300"
              placeholder={t("Name, email, description...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: "status",
        label: t("Status"),
        render: () => (
          <Select
            value={values.status}
            onValueChange={(value) => onFilterChange({ status: value })}
          >
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder={t("Select status")} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ];
  }, [onFilterChange, searchInput, t, values.status]);

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {formFields.map((field) => (
          <Field key={field.key}>
            <FieldLabel className="text-sm font-medium text-foreground-secondary">
              {field.label}
            </FieldLabel>
            {field.render()}
          </Field>
        ))}
      </div>
    </div>
  );
}
