import type { User } from "@/lib/types";
import type { AuthProvider } from "./types";

const KEY = "splitbro:auth";
const listeners = new Set<(u: User | null) => void>();

function read(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

function write(u: User | null): void {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
  else window.localStorage.removeItem(KEY);
  listeners.forEach((cb) => cb(u));
}

const MOCK_ADMIN: User = {
  uid: "mock-admin",
  email: "admin@splitbro.local",
  displayName: "Admin (Mock)",
  photoURL: null,
};

export const mockAuth: AuthProvider = {
  async getCurrentUser() {
    return read();
  },
  async signInWithGoogle() {
    write(MOCK_ADMIN);
    return MOCK_ADMIN;
  },
  async signInWithEmail(email: string) {
    const user: User = { ...MOCK_ADMIN, uid: `mock-${email}`, email, displayName: email };
    write(user);
    return user;
  },
  async signOut() {
    write(null);
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
