"use client";

import { useState } from "react";
import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface RestaurantFormValues {
  name: string;
  date: string | null;
  taxIncluded: boolean;
  taxRate: number;
  totalAmount: number | null;
}

export function RestaurantForm({
  initial,
  sessionMode,
  defaultTaxRate,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<RestaurantFormValues>;
  sessionMode: SessionMode;
  defaultTaxRate: number;
  onSubmit: (values: RestaurantFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [taxIncluded, setTaxIncluded] = useState(initial?.taxIncluded ?? false);
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? defaultTaxRate));
  const [totalAmount, setTotalAmount] = useState(
    initial?.totalAmount != null ? String(initial.totalAmount) : ""
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("restaurant.field.name.required"));
      return;
    }
    setError(null);
    const parsedTax = parseInt(taxRate, 10);
    const parsedTotal = parseFloat(totalAmount);
    onSubmit({
      name: name.trim(),
      date: date.trim() || null,
      taxIncluded,
      taxRate: Number.isNaN(parsedTax) ? defaultTaxRate : parsedTax,
      totalAmount:
        sessionMode === "equal" && !Number.isNaN(parsedTotal) && parsedTotal >= 0
          ? parsedTotal
          : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("restaurant.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("restaurant.field.date")}</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={taxIncluded}
          onChange={(e) => setTaxIncluded(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm font-medium">{t("restaurant.field.taxIncluded")}</span>
      </label>
      {!taxIncluded && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("restaurant.field.taxRate")}</span>
          <Input
            type="number"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </label>
      )}
      {sessionMode === "equal" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("restaurant.field.totalAmount")}</span>
          <Input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </label>
      )}
      {sessionMode === "item_based" && (
        <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-500">
          {t("restaurant.items.placeholder")}
        </div>
      )}
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
