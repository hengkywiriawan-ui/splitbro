"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { getAuthProvider } from "./index";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null; // e.g. "auth/not-approved" from a redirect sign-in
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProviderContext({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getAuthProvider(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let off = () => {};
    (async () => {
      // Finish any pending Google redirect FIRST (upsert + approval check, which
      // signs out unapproved accounts) before trusting the restored auth state.
      try {
        await auth.completeRedirect?.();
      } catch (e) {
        if (active && e instanceof Error && e.message === "auth/not-approved") {
          setAuthError("auth/not-approved");
        }
      }
      if (!active) return;
      const u = await auth.getCurrentUser();
      if (!active) return;
      setUser(u);
      setLoading(false);
      off = auth.onAuthChange((next) => {
        setUser(next);
        setLoading(false);
      });
    })();
    return () => {
      active = false;
      off();
    };
  }, [auth]);

  const value: AuthContextValue = {
    user,
    loading,
    authError,
    signInGoogle: async () => void (await auth.signInWithGoogle()),
    signInEmail: async (email, password) => void (await auth.signInWithEmail(email, password)),
    signOut: async () => auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProviderContext");
  return ctx;
}
