import React, { HTMLAttributes, ReactNode } from "react";

export type TagVariant = "green" | "brown";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  children: ReactNode;
}

const variantStyles: Record<TagVariant, string> = {
  green: "bg-background-secondary text-background-quaternary",
  brown: "bg-background-primary text-button-accent",
};

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ variant = "green", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center justify-center px-[10px] py-[9px] text-sm font-medium rounded-[10px] w-fit text-[10px] ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Tag.displayName = "Tag";
