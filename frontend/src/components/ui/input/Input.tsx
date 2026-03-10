import { useState, useId } from "react";
import type { InputProps } from "./Input.types";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-neutral-500"
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

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 10s2-5 7.5-5 7.5 5 7.5 5-2 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 10s2-5 7.5-5 7.5 5 7.5 5-2 5-7.5 5-7.5-5-7.5-5Z" />
      <path d="M4 4l12 12" strokeWidth="2" />
    </svg>
  );
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled,
  type = "text",
  className = "",
  id: idProp,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasError = Boolean(error);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && passwordVisible ? "text" : type;

  const hasLeft = Boolean(leftIcon);
  const hasRight = Boolean(rightIcon) || isPassword || isLoading;

  const rightContent = isLoading ? (
    <span className="pointer-events-none flex items-center pr-3 text-neutral-500">
      <Spinner />
    </span>
  ) : isPassword ? (
    <button
      type="button"
      onClick={() => setPasswordVisible((v) => !v)}
      className="flex items-center pr-3 text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:text-brand-600"
      tabIndex={-1}
      aria-label={passwordVisible ? "Hide password" : "Show password"}
    >
      <EyeIcon visible={passwordVisible} />
    </button>
  ) : rightIcon ? (
    <span className="pointer-events-none flex items-center pr-3 text-neutral-500 [&>svg]:h-5 [&>svg]:w-5">
      {rightIcon}
    </span>
  ) : null;

  return (
    <div className="w-full">
      <div
        className={[
          "relative flex w-full items-center rounded-sm border bg-surface-raised transition-colors duration-fast",
          hasError
            ? "border-error-500 focus-within:ring-2 focus-within:ring-error-500 focus-within:ring-offset-2"
            : "border-neutral-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
          disabled && "cursor-not-allowed bg-neutral-100 opacity-70",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leftIcon ? (
          <span className="pointer-events-none flex items-center pl-3 text-neutral-500 [&>svg]:h-5 [&>svg]:w-5">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={id}
          type={effectiveType}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hint && !error ? `${id}-hint` : error ? `${id}-error` : undefined}
          className={[
            "w-full min-w-0 border-0 bg-transparent py-2.5 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed",
            hasLeft ? "pl-2" : "pl-3",
            hasRight ? "pr-2" : "pr-3",
          ].join(" ")}
          {...rest}
        />
        {rightContent}
      </div>
    </div>
  );
}
