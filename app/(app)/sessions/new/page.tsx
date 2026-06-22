"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionForm } from "@/components/sessions/SessionForm";

function NewInner() {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { create } = useSessions(user?.uid ?? null);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">{t("session.create.title")}</h1>
      <SessionForm
        onCancel={() => router.push("/sessions")}
        onSubmit={async (values) => {
          await create({ ...values, adminId: user!.uid });
          router.push("/sessions");
        }}
      />
    </main>
  );
}

export default function NewSessionPage() {
  return (
    <AuthGuard>
      <NewInner />
    </AuthGuard>
  );
}
