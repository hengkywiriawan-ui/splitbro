import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/lib/i18n/provider";
import { SessionForm } from "@/components/sessions/SessionForm";

function renderForm(props: Partial<React.ComponentProps<typeof SessionForm>> = {}) {
  const onSubmit = vi.fn();
  render(
    <I18nProvider>
      <SessionForm onSubmit={onSubmit} {...props} />
    </I18nProvider>
  );
  return { onSubmit };
}

describe("SessionForm (create)", () => {
  it("blocks submit when name is empty", async () => {
    const { onSubmit } = renderForm();
    await userEvent.click(screen.getByRole("button", { name: /Simpan|Save/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/wajib diisi|is required/)).toBeInTheDocument();
  });

  it("submits name + selected mode", async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText(/Nama sesi|Session name/), "Trip Kediri");
    await userEvent.click(screen.getByRole("radio", { name: /Bagi Rata|Equal Split/ }));
    await userEvent.click(screen.getByRole("button", { name: /Simpan|Save/ }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Trip Kediri", mode: "equal", defaultTaxRate: 11 });
  });

  it("defaults tax to 11 when the tax-rate input is cleared", async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText(/Nama sesi|Session name/), "Trip Malang");
    await userEvent.click(screen.getByRole("radio", { name: /Bagi Rata|Equal Split/ }));
    await userEvent.clear(screen.getByLabelText(/PPN|VAT/));
    await userEvent.click(screen.getByRole("button", { name: /Simpan|Save/ }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Trip Malang", mode: "equal", defaultTaxRate: 11 });
  });
});

describe("SessionForm (edit)", () => {
  it("locks the mode and does not render the picker", () => {
    renderForm({
      initial: { name: "Existing", mode: "item_based", defaultTaxRate: 10 },
      mode: "edit",
    });
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(/terkunci|locked/)).toBeInTheDocument();
  });
});
