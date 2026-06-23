"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface ItemFormValues {
  name: string;
  price: number;
  assignedTo: string[];
}

export function ItemForm({
  initial,
  members,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ItemFormValues>;
  members: Member[];
  onSubmit: (values: ItemFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [assignedTo, setAssignedTo] = useState<string[]>(initial?.assignedTo ?? []);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  function toggleMember(memberId: string) {
    setAssignedTo((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setNameError(t("item.field.name.required"));
      valid = false;
    } else {
      setNameError(null);
    }
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setPriceError(t("item.field.price.required"));
      valid = false;
    } else {
      setPriceError(null);
    }
    if (assignedTo.length === 0) {
      setAssignError(t("item.field.assignTo.required"));
      valid = false;
    } else {
      setAssignError(null);
    }
    if (!valid) return;
    onSubmit({ name: name.trim(), price: parsedPrice, assignedTo });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("item.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {nameError && <p className="text-sm text-red-600">{nameError}</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("item.field.price")}</span>
        <Input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      {priceError && <p className="text-sm text-red-600">{priceError}</p>}

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t("item.field.assignTo")}</legend>
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <label key={m.memberId} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignedTo.includes(m.memberId)}
                onChange={() => toggleMember(m.memberId)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">{m.name}</span>
            </label>
          ))}
        </div>
        {assignedTo.length > 1 && (
          <p className="mt-1 text-xs text-gray-500">
            {t("item.splitNote.prefix")} {assignedTo.length} {t("item.splitNote.suffix")}
          </p>
        )}
      </fieldset>
      {assignError && <p className="text-sm text-red-600">{assignError}</p>}

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
