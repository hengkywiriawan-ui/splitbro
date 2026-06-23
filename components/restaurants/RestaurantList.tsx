"use client";

import { useState } from "react";
import Link from "next/link";
import type { Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { RestaurantForm, type RestaurantFormValues } from "./RestaurantForm";

export function RestaurantList({
  restaurants,
  sessionMode,
  defaultTaxRate,
  sessionId,
  onUpdate,
  onRemove,
}: {
  restaurants: Restaurant[];
  sessionMode: SessionMode;
  defaultTaxRate: number;
  sessionId: string;
  onUpdate: (restaurantId: string, values: RestaurantFormValues) => void;
  onRemove: (restaurantId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (restaurants.length === 0) {
    return <p className="text-sm text-ink-muted">{t("restaurant.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {restaurants.map((r) => (
        <Card key={r.restaurantId}>
          {editingId === r.restaurantId ? (
            <RestaurantForm
              initial={{
                name: r.name,
                date: r.date,
                taxIncluded: r.taxIncluded,
                taxRate: r.taxRate,
                totalAmount: r.totalAmount,
              }}
              sessionMode={sessionMode}
              defaultTaxRate={defaultTaxRate}
              onSubmit={(values) => {
                onUpdate(r.restaurantId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === r.restaurantId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("restaurant.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(r.restaurantId);
                    setConfirmingId(null);
                  }}
                >
                  {t("common.delete")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.name}</p>
                  <p className="text-sm text-ink-muted">
                    {r.date ? `${r.date} · ` : ""}
                    {r.taxIncluded ? t("restaurant.tax.included") : `PPN ${r.taxRate}%`}
                  </p>
                </div>
                {r.totalAmount != null && <Money amount={r.totalAmount} tone="primary" />}
              </div>
              <div className="flex items-center justify-end gap-1">
                {sessionMode === "item_based" && (
                  <Link
                    href={`/sessions/${sessionId}/restaurants/${r.restaurantId}`}
                    className="inline-flex h-9 items-center rounded-md border border-border-subtle bg-card px-3 text-sm font-medium text-primary-dark hover:bg-surface-gray"
                  >
                    {t("item.title")}
                  </Link>
                )}
                <Button variant="ghost" onClick={() => setEditingId(r.restaurantId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingId(r.restaurantId)}>
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
