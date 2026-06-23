"use client";

import { useState } from "react";
import type { SharedCost } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { SharedCostForm, type SharedCostFormValues } from "./SharedCostForm";

export function SharedCostList({
  sharedCosts,
  onUpdate,
  onRemove,
}: {
  sharedCosts: SharedCost[];
  onUpdate: (costId: string, values: SharedCostFormValues) => void;
  onRemove: (costId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (sharedCosts.length === 0) {
    return <p className="text-sm text-gray-500">{t("sharedCost.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sharedCosts.map((sc) => (
        <Card key={sc.costId}>
          {editingId === sc.costId ? (
            <SharedCostForm
              initial={{ name: sc.name, amount: sc.amount }}
              onSubmit={(values) => {
                onUpdate(sc.costId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === sc.costId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("sharedCost.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(sc.costId);
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
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{sc.name}</p>
                <p className="text-sm text-gray-500">{formatIDR(sc.amount)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(sc.costId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(sc.costId)}>
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
