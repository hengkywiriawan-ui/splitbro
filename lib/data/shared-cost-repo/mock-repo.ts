import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";
import type { SharedCostRepository } from "./types";

function storageKey(sessionId: string): string {
  return `splitbro:sharedcosts:${sessionId}`;
}

function readAll(sessionId: string): SharedCost[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId));
  return raw ? (JSON.parse(raw) as SharedCost[]) : [];
}

function writeAll(sessionId: string, costs: SharedCost[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId), JSON.stringify(costs));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockSharedCostRepo: SharedCostRepository = {
  async list(sessionId) {
    return readAll(sessionId);
  },

  async get(sessionId, costId) {
    return readAll(sessionId).find((c) => c.costId === costId) ?? null;
  },

  async create(input: NewSharedCostInput) {
    const all = readAll(input.sessionId);
    const cost: SharedCost = {
      costId: uid(),
      sessionId: input.sessionId,
      name: input.name,
      amount: input.amount,
    };
    writeAll(input.sessionId, [...all, cost]);
    return cost;
  },

  async update(sessionId, costId, patch: SharedCostPatch) {
    const all = readAll(sessionId);
    const idx = all.findIndex((c) => c.costId === costId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, all);
  },

  async delete(sessionId, costId) {
    writeAll(sessionId, readAll(sessionId).filter((c) => c.costId !== costId));
  },
};
