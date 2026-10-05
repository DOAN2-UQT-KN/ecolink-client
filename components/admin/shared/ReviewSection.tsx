import type { ReactNode } from "react";
import { TbChevronDown } from "react-icons/tb";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/libs/utils";

/** One label / value line of an admin review dialog; an empty value shows "—". */
export function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-[180px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1 break-words text-sm">{value || "—"}</div>
    </div>
  );
}

/** A collapsible section of an admin review dialog. */
export function ReviewSectionCard({
  title,
  hint,
  aside,
  defaultOpen = false,
  isDark,
  children,
}: {
  title: string;
  hint?: string;
  /** Next to the chevron, e.g. a status pill. */
  aside?: ReactNode;
  defaultOpen?: boolean;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "group/section min-w-0 rounded-lg border",
        isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
      )}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 text-left",
          isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50",
        )}
      >
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold">{title}</span>
          {hint && (
            <span className="truncate text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {aside}
          <TbChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/section:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
