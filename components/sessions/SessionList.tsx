"use client";

import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

export function SessionList({
  sessions,
  onOpen,
}: {
  sessions: Session[];
  onOpen: (id: string) => void;
}) {
  const { t } = useT();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl">🧾</span>
        <p className="font-semibold text-ink">{t("sessions.empty")}</p>
        <p className="text-sm text-ink-muted">{t("sessions.emptyHint")}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s) => {
        const isActive = s.status === "active";
        return (
          <li key={s.id}>
            <button type="button" onClick={() => onOpen(s.id)} className="w-full text-left">
              <Card
                variant="premium"
                featured={isActive}
                className="transition-shadow hover:premium-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={isActive ? "gold" : "gray"}>
                    {t(`session.status.${s.status}` as const)}
                  </Badge>
                  <Badge tone={s.mode === "item_based" ? "navy" : "blue"}>
                    {t(`session.mode.${s.mode}` as const)}
                  </Badge>
                </div>

                <h3 className="mt-2 text-lg font-bold text-ink">{s.name}</h3>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {s.members.slice(0, 4).map((m) => (
                      <span key={m.memberId} className="rounded-full ring-2 ring-card">
                        <Avatar name={m.name} size="sm" />
                      </span>
                    ))}
                    {s.members.length > 4 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-gray text-[11px] font-bold text-ink-muted ring-2 ring-card">
                        +{s.members.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-ink-muted">
                    {s.members.length} {t("session.hub.members")}
                  </span>
                </div>
              </Card>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
