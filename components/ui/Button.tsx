import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-gold text-primary hover:bg-gold-dark shadow-sm",
  secondary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  outline: "bg-card text-primary border border-primary hover:bg-primary-soft",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-primary hover:bg-primary-soft",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
