import type { Session, NewSessionInput, SessionPatch } from "@/lib/types";

export interface SessionRepository {
  listByAdmin(adminId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
  create(input: NewSessionInput): Promise<Session>;
  update(id: string, patch: SessionPatch): Promise<void>;
  delete(id: string): Promise<void>;
}
