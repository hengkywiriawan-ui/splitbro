"use client";

import { useState } from "react";
import type { Item, Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { ItemForm, type ItemFormValues } from "./ItemForm";

export function ItemList({
  items,
  members,
  onUpdate,
  onRemove,
}: {
  items: Item[];
  members: Member[];
  onUpdate: (itemId: string, values: ItemFormValues) => void;
  onRemove: (itemId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{t("item.empty")}</p>;
  }

  function memberNames(assignedTo: string[]): string {
    return assignedTo
      .map((id) => members.find((m) => m.memberId === id)?.name ?? id)
      .join(", ");
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.itemId}>
          {editingId === item.itemId ? (
            <ItemForm
              initial={{ name: item.name, price: item.price, assignedTo: item.assignedTo }}
              members={members}
              onSubmit={(values) => {
                onUpdate(item.itemId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === item.itemId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("item.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(item.itemId);
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
                <p className="font-medium">{item.name}</p>
                <p className="text-sm">{formatIDR(item.price)}</p>
                <p className="text-sm text-gray-500">{memberNames(item.assignedTo)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(item.itemId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(item.itemId)}>
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
