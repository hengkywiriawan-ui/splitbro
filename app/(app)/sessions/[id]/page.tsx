"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionForm } from "@/components/sessions/SessionForm";
import { DeleteConfirm } from "@/components/sessions/DeleteConfirm";
import { Button } from "@/components/ui/Button";
import type { Session } from "@/lib/types";

function DetailInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { sessions, loading, update, remove } = useSessions(user?.uid ?? null);
  const [confirming, setConfirming] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(sessions.find((s) => s.id === id) ?? null);
  }, [sessions, id]);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">{t("session.edit.title")}</h1>
      <SessionForm
        mode="edit"
        initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
        onCancel={() => router.push("/sessions")}
        onSubmit={async (values) => {
          await update(session.id, { name: values.name, defaultTaxRate: values.defaultTaxRate });
          router.push("/sessions");
        }}
      />
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => update(session.id, { status: session.status === "active" ? "closed" : "active" })}
        >
          {session.status === "active" ? t("session.status.close") : t("session.status.reopen")}
        </Button>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          {t("common.delete")}
        </Button>
      </div>
      {confirming && (
        <DeleteConfirm
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            await remove(session.id);
            router.push("/sessions");
          }}
        />
      )}
    </main>
  );
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <DetailInner id={id} />
    </AuthGuard>
  );
}
