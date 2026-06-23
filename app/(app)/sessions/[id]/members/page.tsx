"use client";

import { use, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { addMember, updateMember, removeMember } from "@/lib/members";
import { MemberForm } from "@/components/members/MemberForm";
import { MemberList } from "@/components/members/MemberList";
import { Button } from "@/components/ui/Button";

function MembersInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading, update } = useSession(id, user?.uid ?? null);
  const [adding, setAdding] = useState(false);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <PageHeader title={t("member.title")} backHref={`/sessions/${id}`} />

      <MemberList
        members={session.members}
        onUpdate={async (memberId, values) => {
          await update({ members: updateMember(session.members, memberId, values) });
        }}
        onRemove={async (memberId) => {
          await update({ members: removeMember(session.members, memberId) });
        }}
      />

      <div className="mt-4">
        {adding ? (
          <MemberForm
            onSubmit={async (values) => {
              await update({ members: addMember(session.members, values) });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("member.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <MembersInner id={id} />
    </AuthGuard>
  );
}
