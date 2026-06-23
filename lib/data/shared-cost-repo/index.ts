import type { SharedCostRepository } from "./types";
import { mockSharedCostRepo } from "./mock-repo";

export function getSharedCostRepo(): SharedCostRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./firebase-repo") as { firestoreSharedCostRepo: SharedCostRepository })
      .firestoreSharedCostRepo;
  }
  return mockSharedCostRepo;
}
