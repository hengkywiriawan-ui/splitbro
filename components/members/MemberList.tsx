"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Money } from "@/components/ui/Money";
import { MemberForm, type MemberFormValues } from "./MemberForm";

export function MemberList({
  members,
  onUpdate,
  onRemove,
}: {
  members: Member[];
  onUpdate: (memberId: string, values: MemberFormValues) => void;
  onRemove: (memberId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (members.length === 0) {
    return <p className="text-sm text-ink-muted">{t("member.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {members.map((m) => (
        <Card key={m.memberId}>
          {editingId === m.memberId ? (
            <MemberForm
              initial={{ name: m.name, email: m.email, phone: m.phone, deposit: m.deposit }}
              onSubmit={(values) => {
                onUpdate(m.memberId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === m.memberId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("member.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(m.memberId);
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={m.name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.name}</p>
                  {m.email && <p className="truncate text-sm text-ink-muted">{m.email}</p>}
                  {m.phone && <p className="truncate text-sm text-ink-muted">{m.phone}</p>}
                  <Money amount={m.deposit} tone="primary" className="text-sm" />
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" onClick={() => setEditingId(m.memberId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingId(m.memberId)}>
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
