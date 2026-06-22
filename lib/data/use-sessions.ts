"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewSessionInput, Session, SessionPatch } from "@/lib/types";
import { getSessionRepo } from "./index";

export function useSessions(adminId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getSessionRepo();
    if (!adminId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSessions(await repo.listByAdmin(adminId));
    setLoading(false);
  }, [adminId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: NewSessionInput) => {
      const repo = getSessionRepo();
      const session = await repo.create(input);
      await refresh();
      return session;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: SessionPatch) => {
      const repo = getSessionRepo();
      await repo.update(id, patch);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const repo = getSessionRepo();
      await repo.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { sessions, loading, create, update, remove, refresh };
}
