"use client";

import { useState } from "react";
import type { Item, Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Avatar } from "@/components/ui/Avatar";
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
    return <p className="text-sm text-ink-muted">{t("item.empty")}</p>;
  }

  function assigneeNames(assignedTo: string[]): string[] {
    return assignedTo.map((id) => members.find((m) => m.memberId === id)?.name ?? "?");
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
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate font-semibold">{item.name}</p>
                <Money amount={item.price} tone="primary" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex -space-x-2">
                  {assigneeNames(item.assignedTo).map((name, i) => (
                    <span key={i} className="rounded-full ring-2 ring-card">
                      <Avatar name={name} size="sm" />
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" onClick={() => setEditingId(item.itemId)}>
                    {t("common.edit")}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingId(item.itemId)}>
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
