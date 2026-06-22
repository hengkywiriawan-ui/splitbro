import type { SessionRepository } from "./types";
import { mockRepo } from "./mock-repo";

export function getSessionRepo(): SessionRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase session backend not yet implemented");
  }
  return mockRepo;
}
