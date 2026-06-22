"use client";

import { useState } from "react";
import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModePicker } from "./ModePicker";

export interface SessionFormValues {
  name: string;
  mode: SessionMode;
  defaultTaxRate: number;
}

export function SessionForm({
  initial,
  mode = "create",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<SessionFormValues>;
  mode?: "create" | "edit";
  onSubmit: (values: SessionFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(initial?.mode ?? null);
  const [taxRate, setTaxRate] = useState(String(initial?.defaultTaxRate ?? 11));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("session.field.name.required"));
      return;
    }
    if (mode === "create" && !selectedMode) {
      setError(t("session.field.mode.required"));
      return;
    }
    setError(null);
    const parsedTax = parseInt(taxRate, 10);
    onSubmit({ name: name.trim(), mode: (initial?.mode ?? selectedMode) as SessionMode, defaultTaxRate: Number.isNaN(parsedTax) ? 11 : parsedTax });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("session.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("session.field.name")} />
      </label>

      {mode === "create" ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("session.field.mode")}</span>
          <ModePicker value={selectedMode} onChange={setSelectedMode} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t("session.mode.locked")}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("session.field.taxRate")}</span>
        <Input
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          aria-label={t("session.field.taxRate")}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit">{t("common.save")}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
