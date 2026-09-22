import { memo } from "react";
import { useTranslation } from "react-i18next";
import { RiVerifiedBadgeFill } from "react-icons/ri";

import type { IOrganization } from "@/apis/organization/models/organization";
import { cn } from "@/libs/utils";

/**
 * The Blue Tick.
 *
 * It is driven by `trust_tier`, never by `is_email_verified` (which only says the contact
 * mailbox answered) and never by `kyc_status` (which only says the paperwork checked out).
 * A tick under suspension is hidden rather than dimmed: a half-shown badge still reads as
 * endorsement to a visitor.
 */
export function isBlueTickVisible(
  organization: Pick<IOrganization, "trust_tier" | "tick_suspended">,
): boolean {
  return organization.trust_tier === "VERIFIED" && !organization.tick_suspended;
}

export const BlueTickBadge = memo(function BlueTickBadge({
  organization,
  className,
  withLabel = false,
}: {
  organization: Pick<IOrganization, "trust_tier" | "tick_suspended">;
  className?: string;
  withLabel?: boolean;
}) {
  const { t } = useTranslation();

  if (!isBlueTickVisible(organization)) return null;

  const label = t("Verified organization");

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[#1d9bf0]", className)}
      title={label}
      aria-label={label}
    >
      <RiVerifiedBadgeFill className="shrink-0" />
      {withLabel && <span className="text-sm font-medium">{label}</span>}
    </span>
  );
});

export default BlueTickBadge;
