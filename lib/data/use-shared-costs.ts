"use client";

import { useCallback, useEffect, useState } from "react";
import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";
import { getSharedCostRepo } from "./shared-cost-repo/index";

export function useSharedCosts(sessionId: string) {
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getSharedCostRepo();
    setLoading(true);
    setSharedCosts(await repo.list(sessionId));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewSharedCostInput, "sessionId">) => {
      const repo = getSharedCostRepo();
      const sc = await repo.create({ ...input, sessionId });
      await refresh();
      return sc;
    },
    [sessionId, refresh]
  );

  const update = useCallback(
    async (costId: string, patch: SharedCostPatch) => {
      const repo = getSharedCostRepo();
      await repo.update(sessionId, costId, patch);
      await refresh();
    },
    [sessionId, refresh]
  );

  const remove = useCallback(
    async (costId: string) => {
      const repo = getSharedCostRepo();
      await repo.delete(sessionId, costId);
      await refresh();
    },
    [sessionId, refresh]
  );

  return { sharedCosts, loading, add, update, remove, refresh };
}
