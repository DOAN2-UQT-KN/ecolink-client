"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectListOrganization, {
  ALL_ORGANIZATIONS_VALUE,
} from "@/components/form/SelectListOrganization";
import { STATUS } from "@/constants/status";
import { useDebounce } from "@/hooks/useDebounce";
import useCampaignMeContext from "../_hooks/useCampaignMeContext";

const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: "All", value: "all" },
  { labelKey: "Active", value: String(STATUS.ACTIVE) },
  { labelKey: "Inactive", value: String(STATUS.INACTIVE) },
  { labelKey: "Pending", value: String(STATUS.PENDING) },
  { labelKey: "Completed", value: String(STATUS.COMPLETED) },
] as const;

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useCampaignMeContext();

  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchValue, 500);

  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const setUrlParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const normalized = debouncedSearch.trim();
    if ((filters.search ?? "") === normalized) return;
    setFilters({ search: normalized || undefined });
    setUrlParam("search", normalized || undefined);
  }, [debouncedSearch, filters.search, setFilters, setUrlParam]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === "all" ? undefined : Number(value);
      setFilters({ status });
      setUrlParam("status", status != null ? String(status) : undefined);
    },
    [setFilters, setUrlParam],
  );

  const handleOrganizationChange = useCallback(
    (value: string) => {
      const organizationId = value === ALL_ORGANIZATIONS_VALUE ? undefined : value;
      setFilters({ organization_id: organizationId });
      setUrlParam("organization_id", organizationId);
    },
    [setFilters, setUrlParam],
  );

  const statusOptions = useMemo(
    () => CAMPAIGN_STATUS_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">{t("Status")}</FieldLabel>
          <Select value={filters.status != null ? String(filters.status) : "all"} onValueChange={handleStatusChange}>
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
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t("Organization")}
          </FieldLabel>
          <SelectListOrganization
            value={filters.organization_id || ALL_ORGANIZATIONS_VALUE}
            onChange={handleOrganizationChange}
            className="!h-10 !border !border-zinc-300"
            allOptions
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">{t("Title")}</FieldLabel>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("Search by title...")}
              className="h-10 pl-10 !border !border-zinc-300"
            />
          </div>
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
