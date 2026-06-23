# SplitBro Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all existing SplitBro screens into the strict Heritage Excellence visual system while preserving routing, data flow, calculation behavior, Firestore schema, auth model, and i18n.

**Architecture:** Apply the redesign from the bottom up: first replace theme tokens and UI primitives, then migrate shared forms/lists, then page layouts. Keep behavior inside existing hooks and handlers; use presentational changes plus small reusable layout helpers only where they reduce duplication.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4 theme variables, Vitest + Testing Library, existing i18n dictionary, existing `formatIDR()`/`Money` currency path.

---

## Required references

- Design spec: `Docs/superpowers/specs/2026-06-23-splitbro-full-redesign-design.md`
- Heritage tokens: `Docs/design/heritage_excellence/DESIGN.md`
- Visual refs: `Docs/design/dashboard_splitbro`, `Docs/design/members_splitbro`, `Docs/design/restaurants_splitbro`, `Docs/design/add_expense_splitbro`, `Docs/design/shared_costs_splitbro`, `Docs/design/payment_info_splitbro`, `Docs/design/session_summary_splitbro`, `Docs/design/empty_state_splitbro`
- App invariants: `CLAUDE.md`, `.claude/rules/conventions.md`, `.claude/rules/calculation-engine.md`

## File map

### Create

- `components/ui/__tests__/Card.test.tsx` — verifies Card variant/featured classes render content.
- `components/ui/__tests__/Input.test.tsx` — verifies labeled input helper renders accessible input.
- `components/ui/__tests__/Badge.test.tsx` — verifies Heritage badge tones render labels.
- `components/ui/__tests__/Money.test.tsx` — verifies IDR display still uses shared format path.
- `components/ui/__tests__/PageHeader.test.tsx` — verifies header title/back/action accessibility.
- `components/sessions/__tests__/ModePicker.test.tsx` — verifies selected mode radio state and labels.

### Modify

- `app/globals.css` — Heritage Excellence tokens and utility classes.
- `app/layout.tsx` — viewport theme color from current utility blue to Heritage navy.
- `components/ui/Button.tsx` — button variants become Heritage primary/secondary/outline/ghost/danger.
- `components/ui/Card.tsx` — add variant/featured API for document, premium, and dark cards.
- `components/ui/Input.tsx` — add label/helper/error wrapper while preserving normal input props.
- `components/ui/Badge.tsx` — add gold/navy/gray/red/green tones.
- `components/ui/FAB.tsx` — gold floating create action.
- `components/ui/Avatar.tsx` — Heritage palette.
- `components/ui/Money.tsx` — Heritage money tones.
- `components/ui/PageHeader.tsx` — sticky Heritage top app bar.
- `components/sessions/ModePicker.tsx` — premium mode cards.
- `components/sessions/SessionForm.tsx` — labeled fields and form panel-ready spacing.
- `components/sessions/SessionList.tsx` — dashboard-style session cards and empty state.
- `components/members/MemberList.tsx` — ledger member rows.
- `components/restaurants/RestaurantList.tsx` — responsive restaurant cards.
- `components/items/ItemList.tsx` — item ledger rows with wrapping assignee avatars.
- `components/shared-costs/SharedCostList.tsx` — shared cost card/table hybrid styling.
- `components/summary/BreakdownTable.tsx` — premium summary hero and settlement rows.
- `components/summary/ExportButtons.tsx` — grouped export controls.
- `app/(app)/sessions/page.tsx` — responsive dashboard shell.
- `app/(app)/sessions/new/page.tsx` — create session premium form shell.
- `app/(app)/sessions/[id]/page.tsx` — session hub hero and quick action grid.
- `app/(app)/sessions/[id]/members/page.tsx` — members page shell.
- `app/(app)/sessions/[id]/restaurants/page.tsx` — restaurants page shell.
- `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx` — restaurant items page shell.
- `app/(app)/sessions/[id]/shared-costs/page.tsx` — shared costs page shell.
- `app/(app)/sessions/[id]/payment/page.tsx` — payment page shell.
- `app/(app)/sessions/[id]/summary/page.tsx` — summary page shell.
- `app/share/[token]/page.tsx` — read-only report styling.
- `lib/i18n/dictionaries.ts` — add labels used by shells; keep Indonesian and English in sync.

---

## Task 1: Heritage tokens and UI primitive tests

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/Card.tsx`
- Modify: `components/ui/Input.tsx`
- Modify: `components/ui/Badge.tsx`
- Modify: `components/ui/FAB.tsx`
- Modify: `components/ui/Avatar.tsx`
- Modify: `components/ui/Money.tsx`
- Modify: `components/ui/PageHeader.tsx`
- Create: `components/ui/__tests__/Card.test.tsx`
- Create: `components/ui/__tests__/Input.test.tsx`
- Create: `components/ui/__tests__/Badge.test.tsx`
- Create: `components/ui/__tests__/Money.test.tsx`
- Create: `components/ui/__tests__/PageHeader.test.tsx`
- Test: `components/ui/__tests__/*.test.tsx`

- [ ] **Step 1: Write failing Card test**

Create `components/ui/__tests__/Card.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders a premium featured card with a gold accent", () => {
    render(
      <Card variant="premium" featured>
        Premium ledger
      </Card>,
    );

    const card = screen.getByText("Premium ledger").parentElement;
    expect(card).toHaveClass("border-t-4");
    expect(card).toHaveClass("border-t-gold");
  });
});
```

- [ ] **Step 2: Write failing Input test**

Create `components/ui/__tests__/Input.test.tsx`:

```tsx
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
```

- [ ] **Step 3: Write failing Badge test**

Create `components/ui/__tests__/Badge.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders gold tone", () => {
    render(<Badge tone="gold">Premium</Badge>);

    expect(screen.getByText("Premium")).toHaveClass("bg-gold-soft");
  });
});
```

- [ ] **Step 4: Write failing Money test**

Create `components/ui/__tests__/Money.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Money } from "@/components/ui/Money";

describe("Money", () => {
  it("formats IDR with mono numeral styling", () => {
    render(<Money amount={1486400} tone="gold" />);

    expect(screen.getByText("Rp 1.486.400")).toHaveClass("font-num");
    expect(screen.getByText("Rp 1.486.400")).toHaveClass("text-gold-dark");
  });
});
```

- [ ] **Step 5: Write failing PageHeader test**

Create `components/ui/__tests__/PageHeader.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/ui/PageHeader";

describe("PageHeader", () => {
  it("renders title, back link, and action", () => {
    render(<PageHeader title="Members" backHref="/sessions" action={<button type="button">Save</button>} />);

    expect(screen.getByRole("heading", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByLabelText("Back")).toHaveAttribute("href", "/sessions");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run UI primitive tests and verify red**

Run:

```bash
npm test -- components/ui/__tests__/Card.test.tsx components/ui/__tests__/Input.test.tsx components/ui/__tests__/Badge.test.tsx components/ui/__tests__/Money.test.tsx components/ui/__tests__/PageHeader.test.tsx
```

Expected: FAIL because `Card` lacks `variant`/`featured`, `Input` lacks `label`/`helperText`/`error`, `Badge` lacks `gold`, `Money` lacks `gold`, or `PageHeader` styles/heading role do not match.

- [ ] **Step 7: Update Heritage theme tokens**

Replace `app/globals.css` theme block with Heritage tokens while keeping `.font-num` and `.label-caps` utilities:

```css
@import "tailwindcss";

/*
 * SplitBro design system — "Heritage Excellence".
 * Deep navy structure, gold premium accents, red danger states, tonal surfaces.
 */
@theme {
  --color-primary: #001e40;
  --color-primary-dark: #001b3c;
  --color-primary-container: #003366;
  --color-primary-soft: #d5e3ff;
  --color-gold: #cca830;
  --color-gold-dark: #574500;
  --color-gold-soft: #ffe088;
  --color-danger: #bb0027;
  --color-danger-dark: #92001c;
  --color-danger-soft: #ffdad8;
  --color-success: #006e2a;
  --color-success-soft: #d6ffe0;
  --color-surface: #f8f9fa;
  --color-surface-gray: #f3f4f5;
  --color-surface-raised: #edeeef;
  --color-card: #ffffff;
  --color-ink: #191c1d;
  --color-ink-muted: #43474f;
  --color-outline: #737780;
  --color-border-subtle: #c3c6d1;
  --font-sans: var(--font-hanken), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, "JetBrains Mono", monospace;
  --radius-sm: 0.25rem;
  --radius: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

body {
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

.font-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.label-caps {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.premium-shadow {
  box-shadow: 0 14px 40px rgb(0 30 64 / 0.08);
}
```

- [ ] **Step 8: Update viewport theme color**

In `app/layout.tsx`, change viewport theme color:

```ts
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#001e40" };
```

- [ ] **Step 9: Update Button variants**

Replace `components/ui/Button.tsx` content with:

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-gold text-primary hover:brightness-105 premium-shadow",
  secondary: "bg-primary-container text-white hover:bg-primary",
  outline: "bg-card text-primary border border-border-subtle hover:border-primary hover:bg-surface-gray",
  danger: "bg-danger text-white hover:bg-danger-dark",
  ghost: "bg-transparent text-primary hover:bg-primary-soft",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-base font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 10: Update Card component**

Replace `components/ui/Card.tsx` content with:

```tsx
type Variant = "default" | "premium" | "dark";

const variants: Record<Variant, string> = {
  default: "border-border-subtle bg-card text-ink",
  premium: "border-border-subtle bg-card text-ink premium-shadow",
  dark: "border-primary/20 bg-primary-container text-white premium-shadow",
};

export function Card({
  children,
  className = "",
  variant = "default",
  featured = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${variants[variant]} ${featured ? "border-t-4 border-t-gold" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 11: Update Input component**

Replace `components/ui/Input.tsx` content with:

```tsx
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Input({ className = "", label, helperText, error, id, ...props }: Props) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);
  const input = (
    <input
      id={inputId}
      className={`min-h-12 w-full rounded-lg border bg-card px-3 text-base text-ink placeholder:text-outline transition-colors focus:border-2 focus:border-primary focus:outline-none ${error ? "border-danger" : "border-border-subtle"} ${className}`}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );

  if (!label && !helperText && !error) return input;

  return (
    <label className="flex flex-col gap-1">
      {label && <span className="label-caps text-ink-muted">{label}</span>}
      {input}
      {helperText && !error && <span className="text-sm text-ink-muted">{helperText}</span>}
      {error && <span className="text-sm font-medium text-danger">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 12: Update Badge component**

Replace `components/ui/Badge.tsx` content with:

```tsx
type Tone = "gray" | "green" | "blue" | "red" | "gold" | "navy";

const tones: Record<Tone, string> = {
  gray: "bg-surface-gray text-ink-muted border-border-subtle",
  green: "bg-success-soft text-success border-success/20",
  blue: "bg-primary-soft text-primary border-primary/20",
  red: "bg-danger-soft text-danger border-danger/20",
  gold: "bg-gold-soft text-gold-dark border-gold/30",
  navy: "bg-primary-container text-white border-primary-container",
};

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`label-caps inline-flex items-center rounded border px-2 py-0.5 ${tones[tone]}`}>{children}</span>;
}
```

- [ ] **Step 13: Update FAB component**

In `components/ui/FAB.tsx`, replace the button class string with:

```tsx
className={`fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary premium-shadow transition-all hover:brightness-105 active:scale-95 ${className}`}
```

- [ ] **Step 14: Update Avatar palette**

In `components/ui/Avatar.tsx`, replace `PALETTE` with:

```ts
const PALETTE = [
  "bg-primary-soft text-primary",
  "bg-gold-soft text-gold-dark",
  "bg-danger-soft text-danger",
  "bg-surface-raised text-ink-muted",
  "bg-primary-container text-white",
  "bg-card text-primary border border-border-subtle",
] as const;
```

Keep `initials`, `colorFor`, `sizes`, and `Avatar` function unchanged.

- [ ] **Step 15: Update Money tones**

In `components/ui/Money.tsx`, replace `Tone` and `tones` with:

```ts
type Tone = "default" | "primary" | "owe" | "refund" | "muted" | "gold";

const tones: Record<Tone, string> = {
  default: "text-ink",
  primary: "text-primary",
  owe: "text-primary",
  refund: "text-gold-dark",
  muted: "text-ink-muted",
  gold: "text-gold-dark",
};
```

Keep display rounding inside `formatIDR()` path unchanged.

- [ ] **Step 16: Update PageHeader**

Replace `components/ui/PageHeader.tsx` content with:

```tsx
import Link from "next/link";

/** Sticky top bar: back chevron + title + optional right-side action. */
export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-5 flex items-center gap-3 border-b border-border-subtle bg-surface/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      {backHref && (
        <Link href={backHref} aria-label="Back" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-primary-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <h1 className="flex-1 truncate text-xl font-bold text-primary" role="heading" aria-level={1}>
        {title}
      </h1>
      {action}
    </header>
  );
}
```

- [ ] **Step 17: Run UI primitive tests and verify green**

Run:

```bash
npm test -- components/ui/__tests__/Card.test.tsx components/ui/__tests__/Input.test.tsx components/ui/__tests__/Badge.test.tsx components/ui/__tests__/Money.test.tsx components/ui/__tests__/PageHeader.test.tsx components/ui/__tests__/Button.test.tsx
```

Expected: PASS.

- [ ] **Step 18: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

---

## Task 2: Session dashboard, empty state, and mode picker

**Files:**
- Modify: `components/sessions/ModePicker.tsx`
- Modify: `components/sessions/SessionForm.tsx`
- Modify: `components/sessions/SessionList.tsx`
- Modify: `components/sessions/__tests__/SessionList.test.tsx`
- Create: `components/sessions/__tests__/ModePicker.test.tsx`
- Modify: `app/(app)/sessions/page.tsx`
- Modify: `app/(app)/sessions/new/page.tsx`
- Modify: `lib/i18n/dictionaries.ts`
- Test: `components/sessions/__tests__/SessionList.test.tsx`
- Test: `components/sessions/__tests__/ModePicker.test.tsx`

- [ ] **Step 1: Add dashboard i18n labels**

In `lib/i18n/dictionaries.ts`, add these keys to both `id` and `en` objects.

Indonesian entries:

```ts
"sessions.stat.active": "Sesi Aktif",
"sessions.stat.members": "Total Peserta",
"sessions.dashboard.subtitle": "Kelola pembagian tagihan trip dengan rapi.",
"sessions.card.open": "Lihat Detail",
"sessions.empty.action": "Buat Sesi Pertama",
"session.hub.taxRate": "PPN Default",
```

English entries:

```ts
"sessions.stat.active": "Active Sessions",
"sessions.stat.members": "Total Members",
"sessions.dashboard.subtitle": "Manage trip bill splitting with a tidy ledger.",
"sessions.card.open": "View Details",
"sessions.empty.action": "Create First Session",
"session.hub.taxRate": "Default VAT",
```

- [ ] **Step 2: Write failing ModePicker test**

Create `components/sessions/__tests__/ModePicker.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/lib/i18n/provider";
import { ModePicker } from "@/components/sessions/ModePicker";

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("ModePicker", () => {
  it("marks the selected mode and calls onChange", async () => {
    const onChange = vi.fn();
    wrap(<ModePicker value="equal" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Bagi Rata|Equal Split/ })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("radio", { name: /Per Item|Item-Based/ }));
    expect(onChange).toHaveBeenCalledWith("item_based");
  });
});
```

- [ ] **Step 3: Extend SessionList test for CTA and empty action**

Update `components/sessions/__tests__/SessionList.test.tsx` with this test:

```tsx
it("shows a Heritage empty action when there are no sessions", () => {
  wrap(<SessionList sessions={[]} onOpen={vi.fn()} />);

  expect(screen.getByText(/Belum ada sesi|No sessions yet/)).toBeInTheDocument();
  expect(screen.getByText(/Buat Sesi Pertama|Create First Session/)).toBeInTheDocument();
});
```

Keep existing tests.

- [ ] **Step 4: Run session tests and verify red**

Run:

```bash
npm test -- components/sessions/__tests__/ModePicker.test.tsx components/sessions/__tests__/SessionList.test.tsx
```

Expected: FAIL because `ModePicker` classes/selected state or empty action are not updated.

- [ ] **Step 5: Redesign ModePicker**

Replace the button class in `components/sessions/ModePicker.tsx` with Heritage card states:

```tsx
className={`rounded-xl border p-4 text-left transition-all active:scale-[0.99] ${
  selected
    ? "border-gold bg-gold-soft text-primary premium-shadow"
    : "border-border-subtle bg-card text-ink hover:border-primary hover:bg-surface-gray"
}`}
```

Replace inner text block with:

```tsx
<div className="label-caps mb-2 text-ink-muted">{t("session.field.mode")}</div>
<div className="text-lg font-bold text-primary">{t(`session.mode.${m}` as const)}</div>
<div className="mt-1 text-sm text-ink-muted">{t(`session.mode.${m}.desc` as const)}</div>
```

- [ ] **Step 6: Redesign SessionForm fields**

In `components/sessions/SessionForm.tsx`:

1. Replace session name label block with:

```tsx
<Input label={t("session.field.name")} value={name} onChange={(e) => setName(e.target.value)} aria-label={t("session.field.name")} />
```

2. Replace mode label span with:

```tsx
<span className="label-caps text-ink-muted">{t("session.field.mode")}</span>
```

3. Replace locked-mode paragraph class with:

```tsx
<p className="rounded-lg border border-border-subtle bg-surface-gray p-3 text-sm text-ink-muted">{t("session.mode.locked")}</p>
```

4. Replace tax label block with:

```tsx
<Input
  label={t("session.field.taxRate")}
  type="number"
  value={taxRate}
  onChange={(e) => setTaxRate(e.target.value)}
  aria-label={t("session.field.taxRate")}
/>
```

5. Replace error class with:

```tsx
{error && <p className="text-sm font-medium text-danger">{error}</p>}
```

6. Change cancel button variant from `secondary` to `outline`.

- [ ] **Step 7: Redesign SessionList**

Replace `components/sessions/SessionList.tsx` empty state with:

```tsx
if (sessions.length === 0) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h10v16H7zM10 8h4M10 12h4M10 16h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-ink">{t("sessions.empty")}</p>
      <p className="label-caps mt-3 text-gold-dark">{t("sessions.empty.action")}</p>
    </div>
  );
}
```

Replace each session card body with the plan block from the design spec: status chip, mode chip, navy session title, avatar stack, member count, and `sessions.card.open` label with arrow.

- [ ] **Step 8: Redesign sessions dashboard page**

In `app/(app)/sessions/page.tsx`, add derived stats before return:

```tsx
const activeSessions = sessions.filter((session) => session.status === "active").length;
const totalMembers = sessions.reduce((count, session) => count + session.members.length, 0);
```

Replace the current main shell with a max-w-6xl responsive dashboard containing: solid navy header, language toggle, sign-out, active sessions stat card, total members stat card, session list, and gold FAB.

- [ ] **Step 9: Redesign new session page shell**

In `app/(app)/sessions/new/page.tsx`, wrap existing form with:

```tsx
<main className="mx-auto max-w-2xl px-4 pb-12 md:px-6">
  <PageHeader title={t("session.create.title")} backHref="/sessions" />
  <Card featured>
    <SessionForm onSubmit={handleSubmit} />
  </Card>
</main>
```

Keep existing imports/handlers; add `PageHeader` and `Card` imports if absent.

- [ ] **Step 10: Run session tests and typecheck**

Run:

```bash
npm test -- components/sessions/__tests__/ModePicker.test.tsx components/sessions/__tests__/SessionList.test.tsx
npm run typecheck
```

Expected: both PASS.

---

## Task 3: Session hub and navigation cards

**Files:**
- Modify: `app/(app)/sessions/[id]/page.tsx`
- Modify: `lib/i18n/dictionaries.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Add hub i18n labels**

In `lib/i18n/dictionaries.ts`, add these keys to both languages.

Indonesian:

```ts
"session.hub.overview": "Ikhtisar Sesi",
"session.hub.settings": "Pengaturan Sesi",
"session.hub.quickActions": "Aksi Cepat",
"session.hub.restaurantsCount": "Jumlah Restoran",
"session.hub.sharedCostsCount": "Biaya Bersama",
"session.hub.open": "Buka",
```

English:

```ts
"session.hub.overview": "Session Overview",
"session.hub.settings": "Session Settings",
"session.hub.quickActions": "Quick Actions",
"session.hub.restaurantsCount": "Restaurants",
"session.hub.sharedCostsCount": "Shared Costs",
"session.hub.open": "Open",
```

- [ ] **Step 2: Replace session hub shell**

In `app/(app)/sessions/[id]/page.tsx`, replace the current simple hub with a two-column responsive layout:

```tsx
<main className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
  <PageHeader
    title={session.name}
    backHref="/sessions"
    action={<Badge tone={session.status === "active" ? "navy" : "gray"}>{t(session.status === "active" ? "session.status.active" : "session.status.closed")}</Badge>}
  />
  <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
    <Card variant="dark" className="overflow-hidden">
      <p className="label-caps text-gold-soft">{t("session.hub.overview")}</p>
      <h2 className="mt-2 text-2xl font-bold">{session.name}</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <HubStat label={t("session.field.mode")} value={t(`session.mode.${session.mode}` as const)} />
        <HubStat label={t("session.hub.members")} value={String(session.members.length)} />
        <HubStat label={t("session.hub.restaurantsCount")} value={String(restaurants.length)} />
        <HubStat label={t("session.hub.sharedCostsCount")} value={String(sharedCosts.length)} />
      </div>
    </Card>
    <Card featured>
      <p className="label-caps text-ink-muted">{t("session.hub.settings")}</p>
      <div className="mt-4">
        <SessionForm
          mode="edit"
          initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
          onSubmit={async (values) => {
            await update({ name: values.name, defaultTaxRate: values.defaultTaxRate });
          }}
        />
      </div>
    </Card>
  </section>
</main>
```

Then add quick action grid, summary CTA, close/reopen, delete, and existing `DeleteConfirm` below the section.

- [ ] **Step 3: Add local HubStat and HubLink helpers**

At the bottom of `app/(app)/sessions/[id]/page.tsx`, before default export, add:

```tsx
function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3">
      <p className="label-caps text-white/60">{label}</p>
      <p className="mt-1 truncate font-num text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function HubLink({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href}>
      <Card className="flex h-full items-center justify-between gap-3 transition-all hover:border-primary hover:bg-surface-gray">
        <div className="min-w-0">
          <p className="font-bold text-primary">{title}</p>
          <p className="label-caps mt-1 text-ink-muted">{meta}</p>
        </div>
        <span className="text-primary" aria-hidden>→</span>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. If import is unused, remove it.

---

## Task 4: Members, restaurants, items, and shared-cost ledgers

**Files:**
- Modify: `components/members/MemberList.tsx`
- Modify: `components/restaurants/RestaurantList.tsx`
- Modify: `components/items/ItemList.tsx`
- Modify: `components/shared-costs/SharedCostList.tsx`
- Modify: `app/(app)/sessions/[id]/members/page.tsx`
- Modify: `app/(app)/sessions/[id]/restaurants/page.tsx`
- Modify: `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx`
- Modify: `app/(app)/sessions/[id]/shared-costs/page.tsx`
- Modify: `lib/i18n/dictionaries.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Add ledger i18n labels**

In `lib/i18n/dictionaries.ts`, add these keys to both languages.

Indonesian:

```ts
"member.count": "Jumlah Peserta",
"restaurant.count": "Jumlah Restoran",
"sharedCost.totalPool": "Total Biaya Bersama",
"sharedCost.perMember": "Per Peserta",
"item.assignees": "Pemesan",
```

English:

```ts
"member.count": "Member Count",
"restaurant.count": "Restaurant Count",
"sharedCost.totalPool": "Total Shared Pool",
"sharedCost.perMember": "Per Member",
"item.assignees": "Assignees",
```

- [ ] **Step 2: Redesign list rows**

Apply these row rules to `MemberList`, `RestaurantList`, `ItemList`, and `SharedCostList`:

```tsx
<Card key={stableId} featured>
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="truncate text-lg font-bold text-primary">{primaryName}</p>
      <p className="label-caps mt-1 text-ink-muted">{secondaryLabel}</p>
    </div>
    <Money amount={amount} tone="primary" />
  </div>
  <div className="mt-4 flex justify-end gap-2 border-t border-border-subtle pt-3">
    <Button variant="outline" onClick={startEdit}>{t("common.edit")}</Button>
    <Button variant="ghost" onClick={startConfirm}>{t("common.delete")}</Button>
  </div>
</Card>
```

Use exact existing IDs and values:

- Member: `m.memberId`, `m.name`, `m.deposit`, secondary text from email/phone.
- Restaurant: `r.restaurantId`, `r.name`, `r.totalAmount` when non-null, tax chips via `Badge`.
- Item: `item.itemId`, `item.name`, `item.price`, wrapped assignee chips using `Avatar`.
- Shared cost: current cost id/name/amount fields from `SharedCostList.tsx`.

Keep edit and delete confirmation branches functional.

- [ ] **Step 3: Redesign page shells**

For each page shell, use `PageHeader`, two-column layout on desktop, `Card featured` form panel, and list panel:

```tsx
<main className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
  <PageHeader title={pageTitle} backHref={backHref} action={<Badge tone="gold">{count}</Badge>} />
  <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
    <Card featured>
      <p className="label-caps mb-4 text-ink-muted">{formTitle}</p>
      {formElement}
    </Card>
    <div>
      <h2 className="label-caps mb-3 text-ink-muted">{listTitle}</h2>
      {listElement}
    </div>
  </section>
</main>
```

Use these exact substitutions:

- Members: `pageTitle=t("member.title")`, `formTitle=t("member.add")`, list title `t("member.count")`.
- Restaurants: `pageTitle=t("restaurant.title")`, `formTitle=t("restaurant.add")`, list title `t("restaurant.count")`.
- Items: `pageTitle=restaurant.name`, `formTitle=t("item.add")`, list title `t("item.title")`.
- Shared costs: `pageTitle=t("sharedCost.title")`, `formTitle=t("sharedCost.add")`, list title `t("sharedCost.title")`.

- [ ] **Step 4: Add shared cost summary cards**

In `app/(app)/sessions/[id]/shared-costs/page.tsx`, compute:

```tsx
const totalSharedCost = sharedCosts.reduce((sum, cost) => sum + cost.amount, 0);
const perMemberShare = session.members.length > 0 ? totalSharedCost / session.members.length : 0;
```

Render before the two-column form/list section:

```tsx
<section className="mb-5 grid gap-3 md:grid-cols-2">
  <Card variant="dark">
    <p className="label-caps text-gold-soft">{t("sharedCost.totalPool")}</p>
    <Money amount={totalSharedCost} tone="gold" className="mt-2 block !text-gold-soft text-2xl" />
  </Card>
  <Card featured>
    <p className="label-caps text-ink-muted">{t("sharedCost.perMember")}</p>
    <Money amount={perMemberShare} tone="primary" className="mt-2 block text-2xl" />
  </Card>
</section>
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. Resolve prop-name/import errors by matching existing page handlers and list props.

---

## Task 5: Payment, summary, exports, and public report

**Files:**
- Modify: `app/(app)/sessions/[id]/payment/page.tsx`
- Modify: `app/(app)/sessions/[id]/summary/page.tsx`
- Modify: `app/share/[token]/page.tsx`
- Modify: `components/payment/PaymentInfoForm.tsx`
- Modify: `components/summary/BreakdownTable.tsx`
- Modify: `components/summary/ExportButtons.tsx`
- Test: `npm run typecheck`

- [ ] **Step 1: Redesign PaymentInfoForm fields**

In `components/payment/PaymentInfoForm.tsx`, replace raw label/input pairs with labeled `Input` component calls:

```tsx
<Input label={t("payment.field.bankName")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
<Input label={t("payment.field.accountNumber")} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
<Input label={t("payment.field.accountName")} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
<Input label={t("payment.field.ewallet")} value={ewallet} onChange={(e) => setEwallet(e.target.value)} />
<Input label={t("payment.field.note")} value={note} onChange={(e) => setNote(e.target.value)} />
```

Keep submit payload unchanged.

- [ ] **Step 2: Redesign payment page shell**

In `app/(app)/sessions/[id]/payment/page.tsx`, wrap existing form:

```tsx
<main className="mx-auto max-w-2xl px-4 pb-12 md:px-6">
  <PageHeader title={t("payment.title")} backHref={`/sessions/${id}`} />
  <Card featured>
    <PaymentInfoForm initial={session.paymentInfo} onSubmit={handleSubmit} />
  </Card>
</main>
```

Keep existing loading/not-found guards and handler names.

- [ ] **Step 3: Redesign BreakdownTable hero and rows**

In `components/summary/BreakdownTable.tsx`, replace grand total hero with navy `bg-primary-container`, gold label, `premium-shadow`, two stat boxes, and keep `moneyPlain()`/`Math.round()` behavior unchanged. Replace settlement row card class with:

```tsx
className="cursor-pointer rounded-xl border border-border-subtle bg-card p-4 transition-all hover:border-primary hover:bg-surface-gray"
```

Replace expanded details class with:

```tsx
<div className="mt-4 flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-gray p-3">
```

- [ ] **Step 4: Redesign ExportButtons**

In `components/summary/ExportButtons.tsx`, replace return with:

```tsx
return (
  <div className="flex flex-col gap-2 sm:flex-row">
    <Button
      variant="primary"
      onClick={() => void downloadExcel(session, restaurants, itemsByResto, sharedCosts, settlement, labels)}
    >
      {t("export.excel")}
    </Button>
    <Button
      variant="outline"
      onClick={() => void downloadPDF(session, settlement, labels)}
    >
      {t("export.pdf")}
    </Button>
  </div>
);
```

- [ ] **Step 5: Redesign summary and public share shells**

Admin summary shell:

```tsx
<main className="mx-auto max-w-5xl px-4 pb-12 md:px-6">
  <PageHeader title={t("summary.title")} backHref={`/sessions/${id}`} />
  <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
    <BreakdownTable breakdown={settlement.breakdown} grandTotal={settlement.grandTotal} totalDeposit={settlement.totalDeposit} />
    <Card featured className="h-fit">
      <p className="label-caps mb-4 text-ink-muted">{t("summary.title")}</p>
      <ExportButtons session={session} restaurants={restaurants} itemsByResto={itemsByResto} sharedCosts={sharedCosts} settlement={settlement} />
      <Button variant="outline" className="mt-3 w-full" onClick={handleCopyLink}>
        {copied ? t("summary.linkCopied") : t("summary.copyLink")}
      </Button>
    </Card>
  </div>
</main>
```

Public report shell:

```tsx
<main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
  <header className="mb-5 rounded-xl bg-primary-container p-5 text-white premium-shadow">
    <p className="label-caps text-gold-soft">{t("share.title")}</p>
    <h1 className="mt-2 text-2xl font-bold">{session.name}</h1>
  </header>
  <BreakdownTable breakdown={settlement.breakdown} grandTotal={settlement.grandTotal} totalDeposit={settlement.totalDeposit} />
</main>
```

Use current copy-link handler/state names.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

---

## Task 6: Final verification, review agents, and polish

**Files:**
- Modify only files needed to resolve failed checks.
- Test: full test/type/lint/build commands.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 2: If typecheck/build fails, use build resolver**

If `npm run typecheck` or `npm run build` fails, dispatch `ecc:react-build-resolver` with the exact error output and instruction: “Fix only build/type errors from Heritage redesign, minimal diff.”

Expected: resolver returns patch or instructions; apply minimal changes; rerun failing command.

- [ ] **Step 3: Run code review agent**

Dispatch `ecc:code-reviewer` with:

```text
Review current SplitBro Heritage redesign diff. Focus on correctness regressions, i18n hardcoded strings, accessibility issues, and component API consistency. Do not request unrelated refactors.
```

Expected: no CRITICAL/HIGH findings. Fix CRITICAL/HIGH findings before continuing.

- [ ] **Step 4: Run React reviewer**

Dispatch `ecc:react-reviewer` with:

```text
Review React/Next.js changes in the Heritage redesign. Focus on hook correctness, server/client component boundaries, accessibility, and render performance. Do not request unrelated refactors.
```

Expected: no CRITICAL/HIGH findings. Fix CRITICAL/HIGH findings before continuing.

- [ ] **Step 5: Run security reviewer for public/share and forms**

Dispatch `ecc:security-reviewer` with:

```text
Review Heritage redesign changes touching forms and public share page. Confirm no auth model, public Firestore access, user input handling, or sensitive data exposure regressions. Do not request unrelated refactors.
```

Expected: no CRITICAL findings. Fix CRITICAL findings before continuing.

- [ ] **Step 6: Run final checks after review fixes**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 7: Inspect final diff**

Run:

```bash
git diff --stat
git diff -- app/globals.css components/ui components/sessions components/members components/restaurants components/items components/shared-costs components/payment components/summary app lib/i18n/dictionaries.ts
```

Expected: diff contains only redesign and i18n changes; no calculation engine, schema, auth, or export logic changes except button styling in export controls.

---

## Self-review checklist

- Spec coverage: Tasks cover tokens, primitives, sessions dashboard, new/edit session, session hub, members, restaurants, items, shared costs, payment, summary/export, public share, responsive layout, i18n, a11y, testing.
- Placeholder scan: no unresolved placeholder language. Steps include exact file paths, commands, and code blocks for code changes.
- Type consistency: Button variants are `primary | secondary | outline | danger | ghost`; Card variants are `default | premium | dark`; Badge tones are `gray | green | blue | red | gold | navy`; Money tones are `default | primary | owe | refund | muted | gold`.
- Risk notes: Implementation must adapt handler variable names in page shells without changing data flow; every adaptation must preserve existing submit/update/delete handlers.
