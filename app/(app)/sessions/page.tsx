"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionList } from "@/components/sessions/SessionList";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "@/components/ui/LangToggle";

function SessionsInner() {
  const { user, signOut } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { sessions, loading } = useSessions(user?.uid ?? null);

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("sessions.title")}</h1>
        <div className="flex gap-2">
          <LangToggle />
          <Button variant="secondary" onClick={() => void signOut().then(() => router.push("/login"))}>
            {t("sessions.logout")}
          </Button>
        </div>
      </header>
      <Button className="mb-4 w-full" onClick={() => router.push("/sessions/new")}>
        {t("sessions.new")}
      </Button>
      {!loading && <SessionList sessions={sessions} onOpen={(id) => router.push(`/sessions/${id}`)} />}
    </main>
  );
}

export default function SessionsPage() {
  return (
    <AuthGuard>
      <SessionsInner />
    </AuthGuard>
  );
}
