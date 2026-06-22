import type { Session, NewSessionInput, SessionPatch } from "@/lib/types";
import { EMPTY_PAYMENT_INFO } from "@/lib/types";
import type { SessionRepository } from "./types";

const KEY = "splitbro:sessions";

function readAll(): Session[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session[]) : [];
}

function writeAll(sessions: Session[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(sessions));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

let _lastTs = 0;
function monotonicNow(): number {
  const t = Date.now();
  _lastTs = t > _lastTs ? t : _lastTs + 1;
  return _lastTs;
}

export const mockRepo: SessionRepository = {
  async listByAdmin(adminId) {
    return readAll()
      .filter((s) => s.adminId === adminId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async get(id) {
    return readAll().find((s) => s.id === id) ?? null;
  },

  async create(input: NewSessionInput) {
    const now = monotonicNow();
    const session: Session = {
      id: uid(),
      name: input.name,
      adminId: input.adminId,
      mode: input.mode,
      currency: "IDR",
      defaultTaxRate: input.defaultTaxRate ?? 11,
      status: "active",
      shareToken: uid(),
      paymentInfo: { ...EMPTY_PAYMENT_INFO },
      members: [],
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), session]);
    return session;
  },

  async update(id, patch: SessionPatch) {
    const all = readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return;
    // Immutable fields are stripped: id, adminId, mode, shareToken, createdAt.
    const raw = patch as Partial<Session>;
    const { id: _id, adminId: _admin, mode: _mode, shareToken: _tok, createdAt: _created, ...safe } = raw;
    void _id; void _admin; void _mode; void _tok; void _created;
    all[idx] = { ...all[idx], ...safe, updatedAt: Date.now() };
    writeAll(all);
  },

  async delete(id) {
    writeAll(readAll().filter((s) => s.id !== id));
  },
};
