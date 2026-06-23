import type { ReactNode } from "react";

type Tone = "gray" | "green" | "blue" | "red" | "gold" | "navy";

const tones: Record<Tone, string> = {
  gray: "bg-surface-gray text-ink-muted border-border-subtle",
  green: "bg-success-soft text-success border-success/20",
  blue: "bg-primary-soft text-primary border-primary/20",
  red: "bg-danger-soft text-danger border-danger/20",
  gold: "bg-gold-soft text-gold-dark border-gold/30",
  navy: "bg-primary-container text-white border-primary-container",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`label-caps inline-flex items-center rounded border px-2 py-0.5 ${tones[tone]}`}>
      {children}
    </span>
  );
}
