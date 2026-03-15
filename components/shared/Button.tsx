import React, { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "green"
  | "brown"
  | "outlined-green"
  | "outlined-brown";

export type ButtonSize = "large" | "medium" | "small";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  green: "btn-green",
  brown: "btn-brown",
  "outlined-green": "btn-outlined-green",
  "outlined-brown": "btn-outlined-brown",
};

const sizeStyles: Record<ButtonSize, string> = {
  large: "btn-large",
  medium: "btn-medium",
  small: "btn-small",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "green",
      size = "large",
      iconLeft,
      iconRight,
      isLoading = false,
      isDisabled = false,
      children,
      className = "",
      onClick,
      ...props
    },
    ref,
  ) => {
    // Combine classes
    const classes = [
      "btn",
      variantStyles[variant],
      sizeStyles[size],
      isDisabled || isLoading ? "btn-disabled" : "btn-enabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        className={`${classes} group relative overflow-hidden transition-all duration-500`}
        disabled={isDisabled || isLoading}
        onClick={isLoading || isDisabled ? undefined : onClick}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}

        {/* In-flow placeholder — invisible but sizes the button correctly */}
        <span
          aria-hidden
          className={[
            "inline-flex items-center gap-2 invisible leading-none",
            size === "large" ? "px-[0px] py-[0px]" : "",
            size === "medium" ? "px-[0px] py-[0px]" : "",
            size === "small" ? "px-[0px] py-[0px]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!isLoading && iconLeft && (
            <span className="flex-shrink-0 flex items-center">{iconLeft}</span>
          )}
          <span>{children}</span>
          {!isLoading && iconRight && (
            <span className="flex-shrink-0 flex items-center">{iconRight}</span>
          )}
        </span>

        {/* Visible layer — slides up and out on hover */}
        <span className="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-400 group-hover:-translate-y-full ">
          {!isLoading && iconLeft && (
            <span className="flex-shrink-0 flex items-center">{iconLeft}</span>
          )}
          <span>{children}</span>
          {!isLoading && iconRight && (
            <span className="flex-shrink-0 flex items-center">{iconRight}</span>
          )}
        </span>

        {/* Clone layer — starts below, slides up into view on hover */}
        <span className="absolute inset-0 flex items-center justify-center gap-2 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
          {!isLoading && iconLeft && (
            <span className="flex-shrink-0 flex items-center">{iconLeft}</span>
          )}
          <span>{children}</span>
          {!isLoading && iconRight && (
            <span className="flex-shrink-0 flex items-center">{iconRight}</span>
          )}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
