import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TbInfoCircle } from "react-icons/tb";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";

/**
 * An (i) next to a field label or section title that explains it on hover / focus. Use it for
 * static notes (rules, who sees a value, defaults) instead of grey text under the field; keep
 * errors, warnings and state-dependent hints inline.
 *
 * The trigger is a focusable `span`, not a button, so it can sit inside a `<label>` or another
 * `<button>`; clicking it neither focuses the input nor triggers the parent.
 */
export const InfoTooltip = memo(function InfoTooltip({
  content,
  label,
  side,
  iconClassName,
  contentClassName,
}: {
  /** Already translated. */
  content: ReactNode;
  /** Accessible name; defaults to `content` when it is a string. */
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  iconClassName?: string;
  contentClassName?: string;
}) {
  const { t } = useTranslation();
  const ariaLabel = label ?? (typeof content === "string" ? content : t("More information"));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="inline-flex shrink-0 cursor-help rounded-full text-foreground-tertiary outline-none transition-colors hover:text-button-accent focus-visible:text-button-accent focus-visible:ring-2 focus-visible:ring-button-accent/40"
        >
          <TbInfoCircle className={cn("size-4", iconClassName)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className={cn("max-w-xs leading-relaxed", contentClassName)}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
});

export default InfoTooltip;
