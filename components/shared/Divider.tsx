import React, { HTMLAttributes } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  dashSize?: number;
  gap?: number;
  thickness?: number;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ dashSize = 4, gap = 20, thickness, className = "", ...props }, ref) => {
    const isLarge = useMediaQuery("(min-width: 1024px)");
    const resolvedThickness = thickness ?? (isLarge ? 4 : 2);

    return (
      <div
        ref={ref}
        className={`w-full flex items-center ${className}`}
        {...props}
      >
        <svg
          width="100%"
          height={resolvedThickness}
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="0"
            y1={resolvedThickness / 2}
            x2="100%"
            y2={resolvedThickness / 2}
            stroke="currentColor"
            strokeWidth={resolvedThickness}
            strokeDasharray={`${dashSize} ${gap}`}
          />
        </svg>
      </div>
    );
  },
);

Divider.displayName = "Divider";
