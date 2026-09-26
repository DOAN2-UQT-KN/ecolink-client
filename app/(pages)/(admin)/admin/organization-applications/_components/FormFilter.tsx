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
import { useApplicationsContext } from "../_context/ApplicationsContext";

type FormFieldConfig = {
  key: string;
  label: string;
  render: () => React.ReactNode;
};

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange, onResetFilters } = useApplicationsContext();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== filters.search) {
      onFilterChange({ search: next });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const formFields: FormFieldConfig[] = useMemo(() => {
    const statusOptions = [
      { label: t("Needs a decision"), value: "open" },
      { label: t("All"), value: "all" },
      { label: t("Waiting for review"), value: "PENDING_REVIEW" },
      { label: t("Changes needed"), value: "NEEDS_REVISION" },
      { label: t("Approved"), value: "APPROVED" },
      { label: t("Not approved"), value: "REJECTED" },
      { label: t("Withdrawn"), value: "WITHDRAWN" },
    ];

    const orgTypeOptions = [
      { label: t("All"), value: "all" },
      { label: t("School / University"), value: "SCHOOL" },
      { label: t("Government body"), value: "GOV" },
      { label: t("Club"), value: "CLUB" },
      { label: t("NGO"), value: "NGO" },
      { label: t("Social enterprise"), value: "SOCIAL_ENTERPRISE" },
    ];

    const laneOptions = [
      { label: t("All"), value: "all" },
      { label: t("Lane A"), value: "A" },
      { label: t("Lane B"), value: "B" },
    ];

    const renderSelect = (
      value: string,
      options: { label: string; value: string }[],
      onChange: (value: string) => void,
    ) => (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="!h-10 w-full !border !border-input">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    return [
      {
        key: "search",
        label: t("Search"),
        render: () => (
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-10 !border !border-input"
              placeholder={t("Code, contact email, representative...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: "status",
        label: t("Status"),
        render: () =>
          renderSelect(filters.status, statusOptions, (value) =>
            onFilterChange({ status: value }),
          ),
      },
      {
        key: "orgType",
        label: t("Type of organization"),
        render: () =>
          renderSelect(filters.orgType, orgTypeOptions, (value) =>
            onFilterChange({ orgType: value }),
          ),
      },
      {
        key: "lane",
        label: t("Lane"),
        render: () =>
          renderSelect(filters.lane, laneOptions, (value) =>
            onFilterChange({ lane: value }),
          ),
      },
    ];
  }, [filters.lane, filters.orgType, filters.status, onFilterChange, searchInput, t]);

  return (
    <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onResetFilters}
          className="text-sm text-muted-foreground underline"
        >
          {t("Reset filters")}
        </button>
      </div>
    </div>
  );
}

export default FormFilter;
