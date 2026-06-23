import type { AuthProvider } from "./types";
import { mockAuth } from "./mock-auth";

export function getAuthProvider(): AuthProvider {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./firebase-auth") as { firebaseAuthProvider: AuthProvider })
      .firebaseAuthProvider;
  }
  return mockAuth;
}
