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
import { useGiftContext } from "../_context/GiftContext";

type FormFieldConfig = {
  key: string;
  label: string;
  render: () => React.ReactNode;
};

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useGiftContext();
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
    const activeOptions = [
      { label: t("All"), value: "all" },
      { label: t("Active"), value: "active" },
      { label: t("Inactive"), value: "inactive" },
    ];

    const stockOptions = [
      { label: t("All"), value: "all" },
      { label: t("In stock only"), value: "in_stock" },
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
              placeholder={t("Gift name...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: "active",
        label: t("Visibility"),
        render: () => (
          <Select
            value={values.activeFilter}
            onValueChange={(value) =>
              onFilterChange({
                activeFilter: value as typeof values.activeFilter,
              })
            }
          >
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder={t("All")} />
            </SelectTrigger>
            <SelectContent>
              {activeOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "stock",
        label: t("Stock"),
        render: () => (
          <Select
            value={values.stockFilter}
            onValueChange={(value) =>
              onFilterChange({
                stockFilter: value as typeof values.stockFilter,
              })
            }
          >
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder={t("All")} />
            </SelectTrigger>
            <SelectContent>
              {stockOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ];
  }, [onFilterChange, searchInput, t, values.activeFilter, values.stockFilter]);

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">{t("Manage gift catalog and redemptions.")}</p>
        <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
          {t("Reset")}
        </Button>
      </div> */}
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
