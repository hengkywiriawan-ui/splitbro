import type { SessionRepository } from "./types";
import { mockRepo } from "./mock-repo";

export function getSessionRepo(): SessionRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./session-repo/firebase-repo") as { firestoreSessionRepo: SessionRepository })
      .firestoreSessionRepo;
  }
  return mockRepo;
}
