"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { getAuthProvider } from "./index";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProviderContext({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getAuthProvider(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    auth.getCurrentUser().then((u) => {
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    const off = auth.onAuthChange((u) => setUser(u));
    return () => {
      active = false;
      off();
    };
  }, [auth]);

  const value: AuthContextValue = {
    user,
    loading,
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
