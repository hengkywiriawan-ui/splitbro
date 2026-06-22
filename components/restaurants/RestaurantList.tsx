"use client";

import { useState } from "react";
import type { Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { RestaurantForm, type RestaurantFormValues } from "./RestaurantForm";

export function RestaurantList({
  restaurants,
  sessionMode,
  defaultTaxRate,
  onUpdate,
  onRemove,
}: {
  restaurants: Restaurant[];
  sessionMode: SessionMode;
  defaultTaxRate: number;
  onUpdate: (restaurantId: string, values: RestaurantFormValues) => void;
  onRemove: (restaurantId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (restaurants.length === 0) {
    return <p className="text-sm text-gray-500">{t("restaurant.empty")}</p>;
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
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.date && <p className="text-sm text-gray-500">{r.date}</p>}
                <p className="text-sm text-gray-500">
                  {r.taxIncluded ? t("restaurant.tax.included") : `PPN ${r.taxRate}%`}
                </p>
                {r.totalAmount != null && (
                  <p className="text-sm">{formatIDR(r.totalAmount)}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(r.restaurantId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(r.restaurantId)}>
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
