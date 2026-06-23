import { formatIDR } from "@/lib/format";

type Tone = "default" | "primary" | "owe" | "refund" | "muted" | "gold";

const tones: Record<Tone, string> = {
  default: "text-ink",
  primary: "text-primary-dark",
  owe: "text-danger",
  refund: "text-success-dark",
  muted: "text-ink-muted",
  gold: "text-gold-dark",
};

export function Money({
  amount,
  tone = "default",
  className = "",
}: {
  amount: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`font-num font-semibold ${tones[tone]} ${className}`}>{formatIDR(amount)}</span>
  );
}
