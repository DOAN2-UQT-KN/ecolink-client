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
  iconClassName,
  withLabel = false,
}: {
  organization: Pick<IOrganization, "trust_tier" | "tick_suspended">;
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
