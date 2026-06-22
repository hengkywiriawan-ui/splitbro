import { describe, it, expect, beforeEach } from "vitest";
import { mockAuth } from "@/lib/auth/mock-auth";

describe("mockAuth", () => {
  beforeEach(() => localStorage.clear());

  it("starts signed out", async () => {
    expect(await mockAuth.getCurrentUser()).toBeNull();
  });

  it("signs in with Google and persists", async () => {
    const user = await mockAuth.signInWithGoogle();
    expect(user.uid).toBe("mock-admin");
    expect(await mockAuth.getCurrentUser()).toEqual(user);
  });

  it("signs in with email using the email as identity", async () => {
    const user = await mockAuth.signInWithEmail("a@b.c", "pw");
    expect(user.email).toBe("a@b.c");
    expect((await mockAuth.getCurrentUser())?.email).toBe("a@b.c");
  });

  it("signs out", async () => {
    await mockAuth.signInWithGoogle();
    await mockAuth.signOut();
    expect(await mockAuth.getCurrentUser()).toBeNull();
  });

  it("notifies subscribers on change and unsubscribes", async () => {
    const seen: (string | null)[] = [];
    const off = mockAuth.onAuthChange((u) => seen.push(u?.uid ?? null));
    await mockAuth.signInWithGoogle();
    off();
    await mockAuth.signOut();
    expect(seen).toEqual(["mock-admin"]);
  });
});
