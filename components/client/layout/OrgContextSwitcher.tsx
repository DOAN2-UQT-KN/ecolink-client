import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useGetMyOrganizations } from "@/apis/organization/getMyOrganizations";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/client/shared/DropdownMenu";
import { RoleBadge } from "@/components/ui/RoleBadge";
import Link from "@/libs/router";
import useAuthStore from "@/stores/useAuthStore";
import useOrgContextStore from "@/stores/useOrgContextStore";

const PERSONAL = "personal";

/**
 * Picks the organization the "Manage" pages are scoped to, inside the user menu. Lists every
 * organization the user holds a role in. Only a view preference: the server checks the role
 * on each request regardless of what is selected here.
 */
export const OrgContextSwitcher = memo(function OrgContextSwitcher() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const activeId = useOrgContextStore((s) => s.activeOrganizationId);
  const setActiveId = useOrgContextStore((s) => s.setActiveOrganizationId);

  const { data, isSuccess } = useGetMyOrganizations(
    { page: 1, limit: 50, sort_by: "name", sort_order: "asc" },
    { enabled: Boolean(user) },
  );
  const organizations = data?.data?.organizations ?? [];
  const active = organizations.find((org) => org.id === activeId) ?? null;

  // The user may have left or been removed from the selected organization.
  useEffect(() => {
    if (isSuccess && activeId && !organizations.some((org) => org.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, isSuccess, organizations, setActiveId]);

  if (!user || organizations.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">{t("Acting as")}</span>
            <span className="max-w-[180px] truncate text-sm">
              {active ? active.name : t("Personal")}
            </span>
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[240px]">
          <DropdownMenuLabel>{t("Organization context")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={activeId ?? PERSONAL}
            onValueChange={(value) => setActiveId(value === PERSONAL ? null : value)}
          >
            <DropdownMenuRadioItem value={PERSONAL}>{t("Personal")}</DropdownMenuRadioItem>
            {organizations.map((org) => (
              <DropdownMenuRadioItem key={org.id} value={org.id}>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{org.name}</span>
                  <RoleBadge role={org.my_role} />
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {active && (
        <DropdownMenuItem asChild>
          <Link href={`/organizations/${encodeURIComponent(active.slug)}`}>
            {t("Manage organization")}
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </>
  );
});

export default OrgContextSwitcher;
