import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProviderContext, useAuth } from "@/lib/auth/provider";

function Probe() {
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>user: {user?.uid ?? "none"}</p>
      <button onClick={() => signInGoogle()}>in</button>
      <button onClick={() => signOut()}>out</button>
    </div>
  );
}

describe("AuthProviderContext", () => {
  beforeEach(() => localStorage.clear());

  it("exposes auth state and sign-in/out", async () => {
    render(
      <AuthProviderContext>
        <Probe />
      </AuthProviderContext>
    );
    await waitFor(() => expect(screen.getByText("user: none")).toBeInTheDocument());
    await userEvent.click(screen.getByText("in"));
    await waitFor(() => expect(screen.getByText("user: mock-admin")).toBeInTheDocument());
    await userEvent.click(screen.getByText("out"));
    await waitFor(() => expect(screen.getByText("user: none")).toBeInTheDocument());
  });
});
