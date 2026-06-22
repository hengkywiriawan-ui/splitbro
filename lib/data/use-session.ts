"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, SessionPatch } from "@/lib/types";
import { getSessionRepo } from "./index";

export function useSession(id: string, adminId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!adminId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const s = await getSessionRepo().get(id);
    // only expose session that belongs to this admin
    setSession(s?.adminId === adminId ? s : null);
    setLoading(false);
  }, [id, adminId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: SessionPatch) => {
      await getSessionRepo().update(id, patch);
      await refresh();
    },
    [id, refresh]
  );

  return { session, loading, update, refresh };
}
