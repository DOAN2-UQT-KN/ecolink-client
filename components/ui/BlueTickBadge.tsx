import { memo } from "react";
import { useTranslation } from "react-i18next";
import { RiVerifiedBadgeFill } from "react-icons/ri";

import type { IOrganization } from "@/apis/organization/models/organization";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";

type BlueTickFields = Pick<
  IOrganization,
  "trust_tier" | "tick_suspended" | "kyc_status" | "verification_expires_at" | "is_verified"
>;

/**
 * The Blue Tick, same rule as the server (`isOrganizationVerified` in @da2/constants): verified
 * tier, tick not suspended, KYC approved, and a lane-B verification that has not expired. The
 * server sends the result as `is_verified`; the fields are the fallback for older payloads.
 * Never driven by `is_email_verified` alone. A tick under suspension is hidden rather than
 * dimmed: a half-shown badge still reads as endorsement to a visitor.
 */
export function isBlueTickVisible(organization: BlueTickFields): boolean {
  if (typeof organization.is_verified === "boolean") return organization.is_verified;
  if (organization.trust_tier !== "VERIFIED" || organization.tick_suspended) return false;
  if (organization.kyc_status && organization.kyc_status !== "APPROVED") return false;
  const expiresAt = organization.verification_expires_at;
  return !expiresAt || new Date(expiresAt).getTime() > Date.now();
}

export const BlueTickBadge = memo(function BlueTickBadge({
  organization,
  className,
  iconClassName,
  withLabel = false,
}: {
  organization: BlueTickFields;
  className?: string;
  /** Size of the tick itself, e.g. larger next to a page title. */
  iconClassName?: string;
  withLabel?: boolean;
}) {
  const { t } = useTranslation();

  if (!isBlueTickVisible(organization)) return null;

  const label = t("Verified organization");

  // Hover or focus explains the tick: to a visitor it reads as an endorsement, so it should
  // say what exactly was checked.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={label}
          className={cn(
            "inline-flex cursor-help items-center gap-1 rounded-sm text-[#1d9bf0] outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0]/40",
            className,
          )}
        >
          <RiVerifiedBadgeFill className={cn("shrink-0", iconClassName)} />
          {withLabel && <span className="text-sm font-medium">{label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="flex flex-col gap-0.5 font-display-1">
          <span className="font-semibold">{label}</span>
          <span>
            {t(
              "An admin reviewed this organization's legal documents and confirmed who runs it. The tick is hidden while a reported violation is being handled.",
            )}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export default BlueTickBadge;
