import type { ReactNode } from "react";

type Variant = "default" | "premium" | "dark";

const variantClasses: Record<Variant, string> = {
  default: "bg-card",
  premium: "bg-card",
  dark: "bg-primary text-white",
};

export function Card({
  children,
  className = "",
  variant = "default",
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  featured?: boolean;
}) {
  const featuredClass = featured ? "border-t-4 border-t-gold" : "";
  return (
    <div
      className={`rounded-lg border border-border-subtle p-4 ${variantClasses[variant]} ${featuredClass} ${className}`}
    >
      {children}
    </div>
  );
}
