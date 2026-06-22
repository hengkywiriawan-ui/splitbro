"use client";

import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SessionList({
  sessions,
  onOpen,
}: {
  sessions: Session[];
  onOpen: (id: string) => void;
}) {
  const { t } = useT();

  if (sessions.length === 0) {
    return <p className="py-12 text-center text-gray-500">{t("sessions.empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onOpen(s.id)} className="w-full text-left">
            <Card>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.name}</span>
                <Badge tone={s.status === "active" ? "green" : "gray"}>
                  {t(`session.status.${s.status}` as const)}
                </Badge>
              </div>
              <div className="mt-1">
                <Badge tone="blue">{t(`session.mode.${s.mode}` as const)}</Badge>
              </div>
            </Card>
          </button>
        </li>
      ))}
    </ul>
  );
}
