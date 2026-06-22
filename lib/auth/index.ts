import type { AuthProvider } from "./types";
import { mockAuth } from "./mock-auth";

export function getAuthProvider(): AuthProvider {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase auth backend not yet implemented");
  }
  return mockAuth;
}
