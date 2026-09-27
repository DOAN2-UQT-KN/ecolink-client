import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { OrgMemberRole } from "@/apis/organization/models/organization";
import { Pill, type PillTone } from "./Pill";

/** Labels stay raw English; they go through `t()` at render time. */
export const ORG_ROLE_LABEL: Record<OrgMemberRole, string> = {
  LEGAL_REPRESENTATIVE: "Legal representative",
  OWNER: "Owner",
  ADMIN: "Admin",
  CAMPAIGN_MANAGER: "Campaign manager",
  MEMBER: "Member",
};

const ROLE_TONE: Record<OrgMemberRole, PillTone> = {
  LEGAL_REPRESENTATIVE: "brand",
  OWNER: "amber",
  ADMIN: "blue",
  CAMPAIGN_MANAGER: "green",
  MEMBER: "neutral",
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
    <Pill tone={ROLE_TONE[key]} className={className}>
      {t(ORG_ROLE_LABEL[key])}
    </Pill>
  );
});

export default RoleBadge;
