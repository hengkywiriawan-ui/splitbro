const PALETTE = [
  "bg-primary-soft text-primary",
  "bg-gold-soft text-gold-dark",
  "bg-success-soft text-success",
  "bg-danger-soft text-danger",
  "bg-primary-container text-white",
  "bg-surface-gray text-ink-muted",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const sizes = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
} as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof sizes }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${colorFor(name)}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
