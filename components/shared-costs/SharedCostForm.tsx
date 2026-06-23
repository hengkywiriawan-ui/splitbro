"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface SharedCostFormValues {
  name: string;
  amount: number;
}

export function SharedCostForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<SharedCostFormValues>;
  onSubmit: (values: SharedCostFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [nameError, setNameError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setNameError(t("sharedCost.field.name.required"));
      valid = false;
    } else {
      setNameError(null);
    }
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      setAmountError(t("sharedCost.field.amount.required"));
      valid = false;
    } else {
      setAmountError(null);
    }
    if (!valid) return;
    onSubmit({ name: name.trim(), amount: parsed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("sharedCost.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {nameError && <p className="text-sm text-red-600">{nameError}</p>}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("sharedCost.field.amount")}</span>
        <Input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {amountError && <p className="text-sm text-red-600">{amountError}</p>}
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
