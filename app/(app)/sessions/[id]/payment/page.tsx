"use client";

import { use } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { PaymentInfoForm } from "@/components/payment/PaymentInfoForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

function PaymentInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading, update } = useSession(id, user?.uid ?? null);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12">
      <PageHeader title={t("payment.title")} backHref={`/sessions/${id}`} />
      <Card featured>
        <PaymentInfoForm
          initial={session.paymentInfo}
          onSubmit={async (info) => {
            await update({ paymentInfo: info });
          }}
        />
      </Card>
    </main>
  );
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <PaymentInner id={id} />
    </AuthGuard>
  );
}
