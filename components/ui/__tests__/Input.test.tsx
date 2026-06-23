import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders label, helper, and accessible textbox", () => {
    render(<Input label="Session name" helperText="Shown on reports" />);

    expect(screen.getByLabelText("Session name")).toBeInTheDocument();
    expect(screen.getByText("Shown on reports")).toBeInTheDocument();
  });

  it("renders error text when provided", () => {
    render(<Input label="Amount" error="Amount is required" />);

    expect(screen.getByText("Amount is required")).toHaveClass("text-danger");
  });
});
