"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionList } from "@/components/sessions/SessionList";
import { FAB } from "@/components/ui/FAB";
import { LangToggle } from "@/components/ui/LangToggle";

function SessionsInner() {
  const { user, signOut } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { sessions, loading } = useSessions(user?.uid ?? null);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/20 bg-primary/95 px-4 py-3 backdrop-blur">
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-gold">Split</span>
          <span className="text-white">Bro</span>
        </span>
        <div className="flex items-center gap-2">
          <LangToggle />
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-gold"
            onClick={() => void signOut().then(() => router.push("/login"))}
          >
            {t("sessions.logout")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        <h2 className="label-caps mb-4 text-ink-muted">{t("sessions.title")}</h2>
        {!loading && <SessionList sessions={sessions} onOpen={(id) => router.push(`/sessions/${id}`)} />}
      </main>

      <FAB label={t("sessions.new")} onClick={() => router.push("/sessions/new")} />
    </div>
  );
}

export default function SessionsPage() {
  return (
    <AuthGuard>
      <SessionsInner />
    </AuthGuard>
  );
}
