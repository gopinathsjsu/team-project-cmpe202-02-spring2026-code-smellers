import type { ReactNode } from "react";
import type { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-400",
  outline:
    "border-2 border-brand-600 bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500 disabled:border-brand-300 disabled:text-brand-400",
  ghost:
    "border-transparent bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500 disabled:text-brand-400",
  danger:
    "bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500 disabled:bg-error-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-2.5 py-1 gap-1",
  md: "text-base px-3 py-1.5 gap-1.5",
  lg: "text-lg px-4 py-2 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        "inline-flex items-center justify-center !text-sm !font-semibold tracking-normal rounded-sm border border-transparent transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        isLoading && "pointer-events-none opacity-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {isLoading ? (
        <span className="mr-2 shrink-0" aria-hidden="true">
          <Spinner />
        </span>
      ) : leftIcon ? (
        <span className="shrink-0 [&>svg]:h-[1em] [&>svg]:w-[1em]" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {!isLoading && rightIcon ? (
        <span className="shrink-0 [&>svg]:h-[1em] [&>svg]:w-[1em]" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
}

// <Button>Click me</Button>
// <Button variant="outline" size="lg">Browse Events</Button>
// <Button variant="primary" isLoading>Signing in...</Button>
// <Button variant="danger" leftIcon={<TrashIcon />}>Delete</Button>
// <Button fullWidth>Sign up</Button>
