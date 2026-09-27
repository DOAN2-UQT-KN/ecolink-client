import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/libs/utils";

/**
 * The one tag style of the app: status, role, priority and context labels all render as a
 * `Pill`. Pick a tone by meaning (see `constants/statusTone.ts`), never hand-write the classes.
 */
export type PillTone =
  | "neutral"
  | "green"
  | "red"
  | "amber"
  | "orange"
  | "cyan"
  | "blue"
  | "lime"
  | "brand";

export const PILL_TONE: Record<PillTone, { light: string; dark: string }> = {
  neutral: {
    light: "bg-zinc-50 text-zinc-600 border-zinc-200",
    dark: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  },
  green: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  red: {
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  amber: {
    light: "bg-amber-50 text-amber-700 border-amber-200",
    dark: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  orange: {
    light: "bg-orange-50 text-orange-700 border-orange-200",
    dark: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  cyan: {
    light: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dark: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  blue: {
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  lime: {
    light: "bg-lime-50 text-lime-700 border-lime-200",
    dark: "bg-lime-500/15 text-lime-300 border-lime-500/30",
  },
  brand: {
    light: "bg-button-accent/10 text-button-accent border-[rgba(136,122,71,0.35)]",
    dark: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  },
};

/** Solid dot of each tone, for status options in a dropdown menu. */
export const PILL_DOT: Record<PillTone, string> = {
  neutral: "bg-zinc-400",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  lime: "bg-lime-500",
  brand: "bg-button-accent",
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** Admin dark theme (the repo passes `isDark` rather than using `dark:` variants). */
  isDark?: boolean;
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { tone = "neutral", isDark = false, className, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="pill"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        isDark ? PILL_TONE[tone].dark : PILL_TONE[tone].light,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
});

export default Pill;
