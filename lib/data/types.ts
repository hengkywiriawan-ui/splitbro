import type { Session, NewSessionInput } from "@/lib/types";

export interface SessionRepository {
  listByAdmin(adminId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
  create(input: NewSessionInput): Promise<Session>;
  update(id: string, patch: Partial<Session>): Promise<void>;
  delete(id: string): Promise<void>;
}
