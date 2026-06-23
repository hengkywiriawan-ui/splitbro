"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { getSessionRepo } from "@/lib/data/index";
import { SessionForm } from "@/components/sessions/SessionForm";
import { DeleteConfirm } from "@/components/sessions/DeleteConfirm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function HubInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { session, loading, update } = useSession(id, user?.uid ?? null);
  const { restaurants } = useRestaurants(id);
  const { sharedCosts } = useSharedCosts(id);
  const [confirming, setConfirming] = useState(false);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/sessions" className="mb-4 inline-block text-sm text-blue-600">
        ← {t("common.back")}
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-bold">{session.name}</h1>
        <Badge tone={session.status === "active" ? "green" : "gray"}>
          {t(session.status === "active" ? "session.status.active" : "session.status.closed")}
        </Badge>
      </div>

      <SessionForm
        mode="edit"
        initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
        onSubmit={async (values) => {
          await update({ name: values.name, defaultTaxRate: values.defaultTaxRate });
        }}
      />

      <div className="mt-6 flex flex-col gap-3">
        <Link href={`/sessions/${id}/members`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.members")}</span>
            <span className="text-gray-500">{session.members.length} →</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/payment`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.payment")}</span>
            <span className="text-gray-500">→</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/restaurants`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.restaurants")}</span>
            <span className="text-gray-500">{restaurants.length} →</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/shared-costs`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.sharedCosts")}</span>
            <span className="text-gray-500">{sharedCosts.length} →</span>
          </Card>
        </Link>
      </div>

      <Link href={`/sessions/${id}/summary`} className="mt-4 block">
        <Button className="w-full">{t("summary.view")}</Button>
      </Link>

      <div className="mt-6 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => update({ status: session.status === "active" ? "closed" : "active" })}
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
            await getSessionRepo().delete(id);
            router.push("/sessions");
          }}
        />
      )}
    </main>
  );
}

export default function SessionHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <HubInner id={id} />
    </AuthGuard>
  );
}
