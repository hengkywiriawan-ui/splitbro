"use client";

import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function ModePicker({
  value,
  onChange,
}: {
  value: SessionMode | null;
  onChange: (m: SessionMode) => void;
}) {
  const { t } = useT();
  const modes: SessionMode[] = ["equal", "item_based"];
  return (
    <div role="radiogroup" aria-label={t("session.field.mode")} className="grid grid-cols-1 gap-3">
      {modes.map((m) => {
        const selected = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`session.mode.${m}` as const)}
            onClick={() => onChange(m)}
            className={`rounded-xl border p-4 text-left transition-all active:scale-[0.99] ${
              selected
                ? "border-gold bg-gold-soft text-primary premium-shadow"
                : "border-border-subtle bg-card text-ink hover:border-primary hover:bg-surface-gray"
            }`}
          >
            <div className="text-base font-bold">{t(`session.mode.${m}` as const)}</div>
            <div className="mt-1 text-sm text-ink-muted">{t(`session.mode.${m}.desc` as const)}</div>
          </button>
        );
      })}
    </div>
  );
}
