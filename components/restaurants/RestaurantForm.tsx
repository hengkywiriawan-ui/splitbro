"use client";

import { useState } from "react";
import type { Member, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { applyTax } from "@/lib/calc/settlement";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface RestaurantFormValues {
  name: string;
  date: string | null;
  taxIncluded: boolean;
  taxRate: number;
  totalAmount: number | null;
  participantIds: string[];
}

export function RestaurantForm({
  initial,
  sessionMode,
  defaultTaxRate,
  members,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<RestaurantFormValues>;
  sessionMode: SessionMode;
  defaultTaxRate: number;
  members: Member[];
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
  const allIds = members.map((m) => m.memberId);
  const [participants, setParticipants] = useState<Set<string>>(
    () =>
      new Set(
        initial?.participantIds && initial.participantIds.length > 0
          ? initial.participantIds
          : allIds
      )
  );
  const [error, setError] = useState<string | null>(null);

  function toggleParticipant(memberId: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  // Live preview of what each member is actually charged, so the "tax included"
  // checkbox has a visible effect (equal mode enters the bill total here).
  const previewTotal = parseFloat(totalAmount);
  const previewTaxRate = parseInt(taxRate, 10);
  const hasPreview =
    sessionMode === "equal" && !Number.isNaN(previewTotal) && previewTotal >= 0;
  const effectiveTotal = hasPreview
    ? applyTax(previewTotal, {
        taxIncluded,
        taxRate: Number.isNaN(previewTaxRate) ? defaultTaxRate : previewTaxRate,
      })
    : 0;

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
      // Store [] when everyone is selected (= all, and auto-includes members
      // added later); otherwise the explicit attendee list.
      participantIds: (() => {
        const selected = allIds.filter((id) => participants.has(id));
        return selected.length === allIds.length ? [] : selected;
      })(),
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
          {hasPreview && (
            <span className="text-xs text-ink-muted">
              {taxIncluded
                ? t("restaurant.preview.taxIncluded")
                : `${t("restaurant.preview.charged")}: ${formatIDR(effectiveTotal)} (+PPN ${
                    Number.isNaN(previewTaxRate) ? defaultTaxRate : previewTaxRate
                  }%)`}
            </span>
          )}
        </label>
      )}
      {sessionMode === "equal" && members.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("restaurant.field.participants")}</span>
          <div className="flex flex-col gap-1.5 rounded-lg border border-border-subtle p-2">
            {members.map((m) => (
              <label key={m.memberId} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={participants.has(m.memberId)}
                  onChange={() => toggleParticipant(m.memberId)}
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm">{m.name}</span>
              </label>
            ))}
          </div>
          <span className="text-xs text-ink-muted">{t("restaurant.field.participants.hint")}</span>
        </div>
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
