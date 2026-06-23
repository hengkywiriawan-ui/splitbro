import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders a premium featured card with a gold accent", () => {
    render(
      <Card variant="premium" featured>
        <span>Premium ledger</span>
      </Card>,
    );

    const card = screen.getByText("Premium ledger").parentElement;
    expect(card).toHaveClass("border-t-4");
    expect(card).toHaveClass("border-t-gold");
  });
});
