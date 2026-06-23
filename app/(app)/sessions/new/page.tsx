"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionForm } from "@/components/sessions/SessionForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

function NewInner() {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { create } = useSessions(user?.uid ?? null);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12">
      <PageHeader title={t("session.create.title")} backHref="/sessions" />
      <Card featured>
        <SessionForm
          onCancel={() => router.push("/sessions")}
          onSubmit={async (values) => {
            await create({ ...values, adminId: user!.uid });
            router.push("/sessions");
          }}
        />
      </Card>
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
