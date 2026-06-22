import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessions } from "@/lib/data/use-sessions";

describe("useSessions", () => {
  beforeEach(() => localStorage.clear());

  it("loads, creates, and removes sessions for an admin", async () => {
    const { result } = renderHook(() => useSessions("admin1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toHaveLength(0);

    let createdId = "";
    await act(async () => {
      const s = await result.current.create({ name: "Trip", mode: "equal", adminId: "admin1" });
      createdId = s.id;
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    await act(async () => {
      await result.current.remove(createdId);
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(0));
  });
});
