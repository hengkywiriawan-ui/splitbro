import type { User } from "@/lib/types";

export interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
}
