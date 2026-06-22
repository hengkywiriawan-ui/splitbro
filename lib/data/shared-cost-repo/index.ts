import type { SharedCostRepository } from "./types";
import { mockSharedCostRepo } from "./mock-repo";

export function getSharedCostRepo(): SharedCostRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase shared-cost backend not yet implemented");
  }
  return mockSharedCostRepo;
}
