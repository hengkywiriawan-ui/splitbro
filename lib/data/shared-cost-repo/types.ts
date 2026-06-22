import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";

export interface SharedCostRepository {
  list(sessionId: string): Promise<SharedCost[]>;
  get(sessionId: string, costId: string): Promise<SharedCost | null>;
  create(input: NewSharedCostInput): Promise<SharedCost>;
  update(sessionId: string, costId: string, patch: SharedCostPatch): Promise<void>;
  delete(sessionId: string, costId: string): Promise<void>;
}
