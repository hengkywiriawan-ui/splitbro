"use client";

import { use } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { PaymentInfoForm } from "@/components/payment/PaymentInfoForm";

function PaymentInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading, update } = useSession(id, user?.uid ?? null);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("payment.title")}</h1>
      <PaymentInfoForm
        initial={session.paymentInfo}
        onSubmit={async (info) => {
          await update({ paymentInfo: info });
        }}
      />
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
