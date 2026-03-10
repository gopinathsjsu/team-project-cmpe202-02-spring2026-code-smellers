import type { FormFieldProps } from "./Input.types";

export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  htmlFor,
}: FormFieldProps) {
  const showError = Boolean(error);
  const showHint = Boolean(hint) && !showError;

  return (
    <div className="w-full">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-neutral-800"
      >
        {label}
        {required ? <span className="ml-0.5 text-accent-500">*</span> : null}
      </label>
      <div className="mt-0">{children}</div>
      {showHint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-sm text-neutral-400">
          {hint}
        </p>
      ) : null}
      {showError ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-error-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Basic:
// <Input placeholder="Enter your email" type="email" />
//
// With FormField (pass error to both for input styling + message):
// <FormField label="Email" htmlFor="email" required error="Invalid email">
//   <Input id="email" type="email" error="Invalid email" leftIcon={<MailIcon />} />
// </FormField>
//
// Password:
// <FormField label="Password" htmlFor="password">
//   <Input id="password" type="password" />
// </FormField>
