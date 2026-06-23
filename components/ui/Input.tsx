import { useId } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

const inputClasses =
  "min-h-12 w-full rounded-md border border-border-subtle bg-card px-3 text-base text-ink placeholder:text-outline focus:border-2 focus:border-primary focus:outline-none";

export function Input({ className = "", label, helperText, error, ...props }: InputProps) {
  const uid = useId();
  const inputId = props.id ?? uid;

  const field = (
    <input id={inputId} className={`${inputClasses} ${className}`} {...props} />
  );

  if (!label) return field;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      {field}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && helperText && <p className="text-sm text-ink-muted">{helperText}</p>}
    </div>
  );
}
