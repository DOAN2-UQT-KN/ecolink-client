import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { OrgMemberRole } from "@/apis/organization/models/organization";
import { cn } from "@/libs/utils";

/** Labels stay raw English; they go through `t()` at render time. */
export const ORG_ROLE_LABEL: Record<OrgMemberRole, string> = {
  LEGAL_REPRESENTATIVE: "Legal representative",
  OWNER: "Owner",
  ADMIN: "Admin",
  CAMPAIGN_MANAGER: "Campaign manager",
  MEMBER: "Member",
};

const ROLE_CLASS: Record<OrgMemberRole, string> = {
  LEGAL_REPRESENTATIVE: "bg-amber-100 text-amber-800 border-amber-200",
  OWNER: "bg-amber-50 text-amber-800 border-amber-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  CAMPAIGN_MANAGER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEMBER: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

/** A member's role in one organization. */
export const RoleBadge = memo(function RoleBadge({
  role,
  className,
}: {
  role?: OrgMemberRole | string | null;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!role || !(role in ORG_ROLE_LABEL)) return null;
  const key = role as OrgMemberRole;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        ROLE_CLASS[key],
        className,
      )}
    >
      {t(ORG_ROLE_LABEL[key])}
    </span>
  );
});

export default RoleBadge;
