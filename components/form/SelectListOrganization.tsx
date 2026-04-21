"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGetMyOrganizations } from "@/apis/organization/getMyOrganizations";
import { IOrganization } from "@/apis/organization/models/organization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface SelectListOrganizationProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SelectListOrganization = memo(function SelectListOrganization({
  value,
  onChange,
  disabled = false,
}: SelectListOrganizationProps) {
  const { t } = useTranslation();

  const params = useMemo(
    () => ({
      page: 1,
      limit: 100,
      is_owner: true,
      sort_by: "created_at" as const,
      sort_order: "desc" as const,
    }),
    [],
  );

  const { data, isLoading } = useGetMyOrganizations(params, {
    staleTime: 60_000,
  });

  const organizations = useMemo(
    () => data?.data?.organizations ?? [],
    [data?.data?.organizations],
  );

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === value),
    [organizations, value],
  );

  if (isLoading) {
    return <Skeleton className="h-[50px] w-full rounded-md" />;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50">
        <SelectValue
          placeholder={t("Select organization...")}
          aria-label={selectedOrganization?.name || t("Organization")}
        >
          {selectedOrganization ? (
            <OrganizationOption organization={selectedOrganization} />
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            <OrganizationOption organization={organization} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

const OrganizationOption = memo(function OrganizationOption({
  organization,
}: {
  organization: IOrganization;
}) {
  const fallback = useMemo(
    () => organization.name?.slice(0, 1).toUpperCase() || "?",
    [organization.name],
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
        {organization.logo_url ? (
          <Image
            src={organization.logo_url}
            alt={organization.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{organization.name}</span>
        <span className="text-xs text-muted-foreground">
          {organization.contact_email || "-"}
        </span>
      </div>
    </div>
  );
});

export default SelectListOrganization;
