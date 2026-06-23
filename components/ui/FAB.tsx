import type { ButtonHTMLAttributes } from "react";

export function FAB({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary premium-shadow transition-colors hover:bg-gold-dark ${className}`}
      {...props}
    >
      {children ?? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
