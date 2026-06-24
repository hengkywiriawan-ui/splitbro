import type { User } from "@/lib/types";

export interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
  // Completes a pending redirect sign-in (Google) on app load. Throws
  // "auth/not-approved" if the account is not yet approved. Optional: backends
  // without redirect (e.g. mock) omit it.
  completeRedirect?(): Promise<void>;
}
