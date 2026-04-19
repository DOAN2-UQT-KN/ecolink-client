"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Crown, Inbox, User } from "lucide-react";
import { HiOutlineSortAscending, HiOutlineSortDescending } from "react-icons/hi";
import { TbZoom } from "react-icons/tb";

import { useGetMembersByOrg } from "@/apis/organization/organizationById";
import type { IGetMembersRequest } from "@/apis/organization/models/organizationMembers";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/libs/utils";
import useAuthStore from "@/stores/useAuthStore";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";
import Image from "next/image";
import defaultAvatar from "@/public/default-avatar.png";

const FILTER_PANEL_CLASS =
  "w-full space-y-2 p-6 border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 h-fit";

const FILTER_CONTROL_H = "!h-11";

const SEARCH_INPUT_CLASS = cn(
  "pl-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 focus-visible:bg-white transition-all",
  FILTER_CONTROL_H,
);

type MemberSortFilters = Pick<
  IGetMembersRequest,
  "sort_by" | "sort_order"
>;

type SortOptionProps = {
  active: boolean;
  icon: typeof HiOutlineSortAscending | typeof HiOutlineSortDescending;
  ariaLabel: string;
  onClick: () => void;
};

const SortOptionButton = memo(function SortOptionButton({
  active,
  icon: Icon,
  ariaLabel,
  onClick,
}: SortOptionProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-1 py-1 -mx-1 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "text-primary"
          : "text-foreground-secondary hover:text-foreground",
      )}
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
});

const SortFieldRow = memo(function SortFieldRow({
  sortBy,
  filters,
  handleSort,
  t,
}: {
  sortBy: "created_at" | "updated_at";
  filters: MemberSortFilters;
  handleSort: (
    sb: "created_at" | "updated_at",
    so: "asc" | "desc",
  ) => void;
  t: TFunction;
}) {
  const sortOrder = filters.sort_order ?? "desc";
  const active = filters.sort_by === sortBy;
  const displayOrder = active ? sortOrder : "desc";
  const fieldLabel =
    sortBy === "created_at" ? t("Created at") : t("Updated at");
  const Icon =
    displayOrder === "asc"
      ? HiOutlineSortAscending
      : HiOutlineSortDescending;
  const ariaLabel =
    sortBy === "created_at"
      ? displayOrder === "asc"
        ? t("Created at, ascending")
        : t("Created at, descending")
      : displayOrder === "asc"
        ? t("Updated at, ascending")
        : t("Updated at, descending");

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
      role="group"
      aria-label={fieldLabel}
    >
      <SortOptionButton
        active={active}
        icon={Icon}
        ariaLabel={ariaLabel}
        onClick={() => {
          if (active) {
            handleSort(sortBy, sortOrder === "asc" ? "desc" : "asc");
          } else {
            handleSort(sortBy, "desc");
          }
        }}
      />
      <span className="text-sm font-medium shrink-0 text-foreground-secondary">
        {fieldLabel}
      </span>
    </div>
  );
});

function formatMemberDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    return format(parseISO(iso), "PPp");
  } catch {
    return iso;
  }
}

function shortUserId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export const OrganizationMembers = memo(function OrganizationMembers({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const { organizationId, organization } = useOrganizationDetail();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [sortFilters, setSortFilters] = useState<MemberSortFilters>({});

  const membersRequest = useMemo((): IGetMembersRequest => {
    const base: IGetMembersRequest = {
      organization_id: organizationId,
      page: 1,
      limit: 100,
    };
    const trimmed = debouncedSearch.trim();
    if (trimmed) {
      base.search = trimmed;
    }
    if (sortFilters.sort_by) {
      base.sort_by = sortFilters.sort_by;
      base.sort_order = sortFilters.sort_order ?? "desc";
    }
    return base;
  }, [organizationId, debouncedSearch, sortFilters]);

  const { data, isLoading, isError } = useGetMembersByOrg(membersRequest, {
    enabled: enabled && Boolean(organizationId),
  });

  const ownerId = organization?.owner_id;

  const handleSort = useCallback(
    (sort_by: "created_at" | "updated_at", sort_order: "asc" | "desc") => {
      setSortFilters({ sort_by, sort_order });
    },
    [],
  );

  const membersRaw = data?.data?.members ?? [];
  const membersList = useMemo(() => {
    if (!ownerId) return membersRaw;
    return membersRaw.filter((m) => m.user_id !== ownerId);
  }, [membersRaw, ownerId]);

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="w-full rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/70 p-4 sm:p-5 shadow-sm">
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t("Owner")}
        </p>
        <div className="mt-3 flex items-center gap-3 min-w-0 justify-center">
          {/* <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(136,122,71,0.35)] bg-white/80">
            <Crown className="size-5 text-button-accent" aria-hidden />
          </div> */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
               */}  
              <Image src={organization?.owner?.avatar || defaultAvatar} alt={organization?.owner?.name} width={40} height={40} className="rounded-full" />
              <span className="text-sm font-medium text-foreground break-all">
                {ownerId ? organization?.owner?.name : "—"}
              </span>
              {ownerId &&
              currentUserId != null &&
              ownerId === currentUserId ? (
                <span className="text-xs font-medium text-button-accent bg-background-primary px-2 py-1 rounded-md">
                  {t("You")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-6">
          <Field className="flex-1 min-w-[200px]">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Search")}
            </FieldLabel>
            <div className="relative group">
              <TbZoom className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                className={SEARCH_INPUT_CLASS}
                placeholder={t("Search members by user name")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </Field>

          <Field className="w-full lg:w-auto lg:min-w-0">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Sort")}
            </FieldLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              <SortFieldRow
                sortBy="created_at"
                filters={sortFilters}
                handleSort={handleSort}
                t={t}
              />
              <SortFieldRow
                sortBy="updated_at"
                filters={sortFilters}
                handleSort={handleSort}
                t={t}
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {t("Could not load members.")}
          </p>
        ) : membersList.length === 0 ? (
          <div className="flex justify-center pt-12 pb-20">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox className="h-12 w-12 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>{t("No members found.")}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    "Try adjusting your search or sort options to find members.",
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {membersList.map((m) => (
              <li
                key={m.user_id}
                className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-foreground break-all">
                    {shortUserId(m.user_id)}
                  </span>
                  {currentUserId != null && m.user_id === currentUserId ? (
                    <span className="text-xs font-medium text-primary shrink-0">
                      {t("You")}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-foreground-secondary shrink-0">
                  {formatMemberDate(m.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});
