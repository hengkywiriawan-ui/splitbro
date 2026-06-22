import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n/provider";
import { SessionList } from "@/components/sessions/SessionList";
import type { Session } from "@/lib/types";

const base: Omit<Session, "id" | "name" | "mode"> = {
  adminId: "admin1",
  currency: "IDR",
  defaultTaxRate: 11,
  status: "active",
  shareToken: "t",
  paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
  members: [],
  createdAt: 1,
  updatedAt: 1,
};

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("SessionList", () => {
  it("shows the empty state when there are no sessions", () => {
    wrap(<SessionList sessions={[]} onOpen={vi.fn()} />);
    expect(screen.getByText(/Belum ada sesi|No sessions yet/)).toBeInTheDocument();
  });

  it("renders one card per session with its mode label", () => {
    const sessions: Session[] = [
      { ...base, id: "1", name: "Trip A", mode: "equal" },
      { ...base, id: "2", name: "Trip B", mode: "item_based" },
    ];
    wrap(<SessionList sessions={sessions} onOpen={vi.fn()} />);
    expect(screen.getByText("Trip A")).toBeInTheDocument();
    expect(screen.getByText("Trip B")).toBeInTheDocument();
    expect(screen.getByText(/Bagi Rata|Equal Split/)).toBeInTheDocument();
    expect(screen.getByText(/Per Item|Item-Based/)).toBeInTheDocument();
  });
});
