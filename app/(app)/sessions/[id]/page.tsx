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
import { PageHeader } from "@/components/ui/PageHeader";

function NavCard({ href, label, meta }: { href: string; label: string; meta?: string }) {
  return (
    <Link href={href}>
      <Card className="flex cursor-pointer items-center justify-between transition-colors hover:border-gold">
        <span className="font-medium text-ink">{label}</span>
        <div className="flex items-center gap-2 text-ink-muted">
          {meta && <span className="text-sm font-semibold">{meta}</span>}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Card>
    </Link>
  );
}

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
    <main className="mx-auto max-w-2xl pb-10">
      <PageHeader
        title={session.name}
        backHref="/sessions"
        action={
          <Badge tone={session.status === "active" ? "gold" : "gray"}>
            {t(session.status === "active" ? "session.status.active" : "session.status.closed")}
          </Badge>
        }
      />

      <div className="px-4">
        <SessionForm
          mode="edit"
          initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
          onSubmit={async (values) => {
            await update({ name: values.name, defaultTaxRate: values.defaultTaxRate });
          }}
        />

        <div className="mt-6 flex flex-col gap-2">
          <NavCard
            href={`/sessions/${id}/members`}
            label={t("session.hub.members")}
            meta={String(session.members.length)}
          />
          <NavCard href={`/sessions/${id}/payment`} label={t("session.hub.payment")} />
          <NavCard
            href={`/sessions/${id}/restaurants`}
            label={t("session.hub.restaurants")}
            meta={String(restaurants.length)}
          />
          <NavCard
            href={`/sessions/${id}/shared-costs`}
            label={t("session.hub.sharedCosts")}
            meta={String(sharedCosts.length)}
          />
        </div>

        <Link href={`/sessions/${id}/summary`} className="mt-5 block">
          <Button className="w-full">{t("summary.view")}</Button>
        </Link>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              void update({ status: session.status === "active" ? "closed" : "active" })
            }
          >
            {session.status === "active" ? t("session.status.close") : t("session.status.reopen")}
          </Button>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {t("common.delete")}
          </Button>
        </div>
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
