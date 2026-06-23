# Phase 1D — Ringkasan, Export & Share: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build settlement summary display, Excel/PDF export, and a public share link so the admin can show and distribute bill results to trip members.

**Architecture:** A new summary page (`/sessions/[id]/summary`) loads all session data, calls the existing pure `computeSettlement`, and renders a collapsible `BreakdownTable`. Export functions in `lib/export/` use SheetJS (Excel) and pdfmake (PDF) via dynamic imports to avoid SSR issues. A public share page (`/share/[token]`) outside the auth route group uses `findByShareToken` — a new method added to `SessionRepository` — to load session data without login.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind · SheetJS `xlsx` · pdfmake · existing `computeSettlement` pure function from `lib/calc/settlement.ts`

---

## File Map

**Create:**
- `lib/data/use-public-session.ts` — loads all session data by shareToken (no auth)
- `components/summary/BreakdownTable.tsx` — collapsible per-member breakdown (reused on both pages)
- `components/summary/ExportButtons.tsx` — Excel + PDF download buttons
- `lib/export/excel.ts` — SheetJS workbook builder + download trigger
- `lib/export/pdf.ts` — pdfmake document builder + download trigger
- `app/(app)/sessions/[id]/summary/page.tsx` — protected summary page
- `app/share/[token]/page.tsx` — public share page (outside `(app)` group)

**Modify:**
- `lib/i18n/dictionaries.ts` — 17 new keys
- `lib/data/types.ts` — add `findByShareToken` to `SessionRepository` interface
- `lib/data/mock-repo.ts` — implement `findByShareToken`
- `app/(app)/sessions/[id]/page.tsx` — add "Lihat Ringkasan" button to hub

**Tests:**
- `lib/data/__tests__/mock-repo.test.ts` — add 2 tests for `findByShareToken`

---

### Task 1: i18n Keys

**Files:**
- Modify: `lib/i18n/dictionaries.ts`

- [ ] **Step 1: Add 17 new keys to both dicts**

In `lib/i18n/dictionaries.ts`, add after `"item.equalModeOnly": "Item hanya tersedia di mode item-based.",` in the `id` dict:

```ts
    "summary.view": "Lihat Ringkasan",
    "summary.title": "Ringkasan Tagihan",
    "summary.grandTotal": "Grand Total",
    "summary.totalDeposit": "Total Deposit",
    "summary.field.consumption": "Konsumsi",
    "summary.field.sharedShare": "Biaya Bersama",
    "summary.field.total": "Total Tagihan",
    "summary.field.deposit": "Deposit",
    "summary.netDue.owe": "Harus Bayar",
    "summary.netDue.refund": "Uang Kembali",
    "summary.netDue.settled": "Lunas",
    "summary.copyLink": "Salin Link Laporan",
    "summary.linkCopied": "Tersalin!",
    "export.excel": "Unduh Excel",
    "export.pdf": "Unduh PDF",
    "share.title": "Laporan Tagihan",
    "share.notFound": "Laporan tidak ditemukan.",
```

Add after `"item.equalModeOnly": "Items are only available in item-based mode.",` in the `en` dict:

```ts
    "summary.view": "View Summary",
    "summary.title": "Bill Summary",
    "summary.grandTotal": "Grand Total",
    "summary.totalDeposit": "Total Deposit",
    "summary.field.consumption": "Consumption",
    "summary.field.sharedShare": "Shared Costs",
    "summary.field.total": "Total Bill",
    "summary.field.deposit": "Deposit",
    "summary.netDue.owe": "Must Pay",
    "summary.netDue.refund": "Refund",
    "summary.netDue.settled": "Settled",
    "summary.copyLink": "Copy Report Link",
    "summary.linkCopied": "Copied!",
    "export.excel": "Download Excel",
    "export.pdf": "Download PDF",
    "share.title": "Bill Report",
    "share.notFound": "Report not found.",
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors (TypeScript validates exhaustive key coverage via `as const`).

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/dictionaries.ts
git commit -m "feat: add Phase 1D i18n keys (summary, export, share)"
```

---

### Task 2: findByShareToken

**Files:**
- Modify: `lib/data/types.ts`
- Modify: `lib/data/mock-repo.ts`
- Modify: `lib/data/__tests__/mock-repo.test.ts`

Context: `SessionRepository` is in `lib/data/types.ts`. Mock implementation is in `lib/data/mock-repo.ts`. The mock stores all sessions in a single localStorage key `splitbro:sessions` as a flat array — `readAll()` returns `Session[]`.

- [ ] **Step 1: Add method to interface**

In `lib/data/types.ts`, add `findByShareToken` after `delete`:

```ts
import type { Session, NewSessionInput, SessionPatch } from "@/lib/types";

export interface SessionRepository {
  listByAdmin(adminId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
  create(input: NewSessionInput): Promise<Session>;
  update(id: string, patch: SessionPatch): Promise<void>;
  delete(id: string): Promise<void>;
  findByShareToken(token: string): Promise<Session | null>;
}
```

- [ ] **Step 2: Write failing tests**

In `lib/data/__tests__/mock-repo.test.ts`, add this `describe` block at the end of the file:

```ts
describe("findByShareToken", () => {
  beforeEach(() => localStorage.clear());

  it("returns null for unknown token", async () => {
    const result = await mockRepo.findByShareToken("nonexistent-token");
    expect(result).toBeNull();
  });

  it("finds session by shareToken", async () => {
    const session = await mockRepo.create({ name: "Trip", mode: "equal", adminId: "u1" });
    const found = await mockRepo.findByShareToken(session.shareToken);
    expect(found?.id).toBe(session.id);
    expect(found?.shareToken).toBe(session.shareToken);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```
npx vitest run lib/data/__tests__/mock-repo.test.ts
```
Expected: 2 new tests fail (TypeScript error or "findByShareToken is not a function").

- [ ] **Step 4: Implement in mock-repo**

In `lib/data/mock-repo.ts`, add after the `delete` method (before the closing `}`):

```ts
  async findByShareToken(token: string): Promise<Session | null> {
    if (typeof window === "undefined") return null;
    return readAll().find((s) => s.shareToken === token) ?? null;
  },
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run lib/data/__tests__/mock-repo.test.ts
```
Expected: all tests in this file pass.

- [ ] **Step 6: Full test suite + type-check**

```
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/data/types.ts lib/data/mock-repo.ts lib/data/__tests__/mock-repo.test.ts
git commit -m "feat: add findByShareToken to SessionRepository"
```

---

### Task 3: usePublicSession Hook

**Files:**
- Create: `lib/data/use-public-session.ts`

This hook loads all data needed for `computeSettlement` starting from a `shareToken`. No auth required. Used only by the share page.

- [ ] **Step 1: Create the hook**

Create `lib/data/use-public-session.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import type { Item, Restaurant, Session, SharedCost } from "@/lib/types";
import { getSessionRepo } from "@/lib/data/index";
import { getRestaurantRepo } from "@/lib/data/restaurant-repo/index";
import { getItemRepo } from "@/lib/data/item-repo/index";
import { getSharedCostRepo } from "@/lib/data/shared-cost-repo/index";

export function usePublicSession(token: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const found = await getSessionRepo().findByShareToken(token);
      if (!found) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSession(found);
      const [restos, costs] = await Promise.all([
        getRestaurantRepo().list(found.id),
        getSharedCostRepo().list(found.id),
      ]);
      setRestaurants(restos);
      setSharedCosts(costs);
      if (found.mode === "item_based") {
        const itemRepo = getItemRepo();
        const entries = await Promise.all(
          restos.map(
            async (r) => [r.restaurantId, await itemRepo.list(found.id, r.restaurantId)] as const
          )
        );
        setItemsByResto(Object.fromEntries(entries));
      }
      setLoading(false);
    }
    void load();
  }, [token]);

  return { session, restaurants, itemsByResto, sharedCosts, loading, notFound };
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data/use-public-session.ts
git commit -m "feat: add usePublicSession hook for share page"
```

---

### Task 4: BreakdownTable Component

**Files:**
- Create: `components/summary/BreakdownTable.tsx`

Collapsible cards per member showing settlement breakdown. Reused on both summary page and share page. `Math.round` happens HERE — never in `computeSettlement`.

- [ ] **Step 1: Create the component**

Create `components/summary/BreakdownTable.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Breakdown } from "@/lib/calc/settlement";
import { useT } from "@/lib/i18n/provider";
import { formatIDR } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export function BreakdownTable({
  breakdown,
  grandTotal,
  totalDeposit,
}: {
  breakdown: Breakdown[];
  grandTotal: number;
  totalDeposit: number;
}) {
  const { t } = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (breakdown.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {breakdown.map((b) => {
        const isExpanded = expandedId === b.memberId;
        const netRounded = Math.round(b.netDue);
        const netLabel =
          netRounded > 0
            ? t("summary.netDue.owe")
            : netRounded < 0
            ? t("summary.netDue.refund")
            : t("summary.netDue.settled");
        const netColor =
          netRounded > 0
            ? "text-red-600"
            : netRounded < 0
            ? "text-green-600"
            : "text-gray-500";

        return (
          <Card
            key={b.memberId}
            className="cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : b.memberId)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{b.name}</span>
              <span className={`text-sm font-semibold ${netColor}`}>
                {netLabel}: {formatIDR(Math.abs(netRounded))}
              </span>
            </div>

            {isExpanded && (
              <div className="mt-3 flex flex-col gap-1 border-t pt-3">
                <BreakdownRow label={t("summary.field.consumption")} value={b.consumption} />
                <BreakdownRow label={t("summary.field.sharedShare")} value={b.sharedShare} />
                <BreakdownRow label={t("summary.field.total")} value={b.totalTagihan} bold />
                <BreakdownRow label={t("summary.field.deposit")} value={b.deposit} />
                <BreakdownRow
                  label={netLabel}
                  value={Math.abs(b.netDue)}
                  colorClass={netColor}
                  bold
                />
              </div>
            )}
          </Card>
        );
      })}

      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{t("summary.grandTotal")}</span>
          <span className="font-bold">{formatIDR(Math.round(grandTotal))}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t("summary.totalDeposit")}</span>
          <span>{formatIDR(Math.round(totalDeposit))}</span>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold = false,
  colorClass = "text-gray-700",
}: {
  label: string;
  value: number;
  bold?: boolean;
  colorClass?: string;
}) {
  return (
    <div className={`flex justify-between text-sm ${colorClass}`}>
      <span>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{formatIDR(Math.round(value))}</span>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/summary/BreakdownTable.tsx
git commit -m "feat: add BreakdownTable component for settlement display"
```

---

### Task 5: Install Export Dependencies

**Files:**
- Modify: `package.json` (via npm)

`xlsx` and `pdfmake` are in the tech stack but not yet installed.

- [ ] **Step 1: Install packages**

```
npm install xlsx pdfmake
```

Both packages bundle their own TypeScript declarations — no separate `@types/` packages needed.

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install xlsx and pdfmake for export"
```

---

### Task 6: Excel Export

**Files:**
- Create: `lib/export/excel.ts`

Two-sheet workbook: "Ringkasan" (settlement per member + payment info) and "Detail" (per-restaurant breakdown). Uses SheetJS via dynamic import.

- [ ] **Step 1: Create lib/export/excel.ts**

```ts
import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";

function applyTaxLocal(base: number, r: { taxIncluded: boolean; taxRate: number }): number {
  if (r.taxIncluded) return base;
  return base + base * r.taxRate / 100;
}

export async function downloadExcel(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[],
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): Promise<void> {
  const XLSX = await import("xlsx");

  // Sheet 1: Ringkasan
  const summaryRows: (string | number)[][] = [
    ["Nama", "Konsumsi", "Biaya Bersama", "Total Tagihan", "Deposit", "Net Due"],
    ...settlement.breakdown.map((b) => [
      b.name,
      Math.round(b.consumption),
      Math.round(b.sharedShare),
      Math.round(b.totalTagihan),
      Math.round(b.deposit),
      Math.round(b.netDue),
    ]),
    [],
    ["Grand Total", "", "", Math.round(settlement.grandTotal), Math.round(settlement.totalDeposit), ""],
  ];

  const pi = session.paymentInfo;
  summaryRows.push([], ["Info Pembayaran", ""]);
  if (pi.bankName) summaryRows.push(["Bank", pi.bankName]);
  if (pi.accountNumber) summaryRows.push(["No. Rekening", pi.accountNumber]);
  if (pi.accountName) summaryRows.push(["Atas Nama", pi.accountName]);
  if (pi.ewallet) summaryRows.push(["E-Wallet", pi.ewallet]);
  if (pi.note) summaryRows.push(["Catatan", pi.note]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Sheet 2: Detail
  const detailRows: (string | number)[][] = [];
  const N = session.members.length || 1;

  if (session.mode === "equal") {
    detailRows.push(["Restoran", "Tanggal", "Total (after tax)", "Per Orang"]);
    for (const r of restaurants) {
      const effectiveTotal = applyTaxLocal(r.totalAmount ?? 0, r);
      detailRows.push([r.name, r.date ?? "", Math.round(effectiveTotal), Math.round(effectiveTotal / N)]);
    }
  } else {
    detailRows.push(["Restoran", "Item", "Harga", "Assigned To", "Subtotal Per Orang"]);
    for (const r of restaurants) {
      const items = itemsByResto[r.restaurantId] ?? [];
      for (const item of items) {
        const assignedNames = item.assignedTo
          .map((id) => session.members.find((m) => m.memberId === id)?.name ?? "?")
          .join(", ");
        detailRows.push([
          r.name,
          item.name,
          Math.round(item.price),
          assignedNames,
          Math.round(item.price / (item.assignedTo.length || 1)),
        ]);
      }
    }
    if (sharedCosts.length > 0) {
      detailRows.push([], ["Biaya Bersama", "", "", "", ""]);
      for (const sc of sharedCosts) {
        detailRows.push([sc.name, "", Math.round(sc.amount), "Semua", Math.round(sc.amount / N)]);
      }
    }
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `splitbro-${session.name}-${date}.xlsx`);
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/export/excel.ts
git commit -m "feat: add Excel export with SheetJS"
```

---

### Task 7: PDF Export

**Files:**
- Create: `lib/export/pdf.ts`

Single-document PDF: session name, settlement table, payment info. Uses pdfmake via dynamic import to avoid SSR issues. Called only from client-side button clicks.

- [ ] **Step 1: Create lib/export/pdf.ts**

```ts
import type { Session } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import { formatIDR } from "@/lib/format";

export async function downloadPDF(
  session: Session,
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): Promise<void> {
  // Dynamic imports prevent SSR errors — pdfmake references browser globals at module init.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = ((await import("pdfmake/build/pdfmake")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = ((await import("pdfmake/build/vfs_fonts")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs;

  const date = new Date().toLocaleDateString("id-ID");
  const pi = session.paymentInfo;

  const tableBody: object[][] = [
    [
      { text: "Nama", bold: true, fillColor: "#f3f4f6" },
      { text: "Konsumsi", bold: true, fillColor: "#f3f4f6" },
      { text: "Biaya Bersama", bold: true, fillColor: "#f3f4f6" },
      { text: "Total", bold: true, fillColor: "#f3f4f6" },
      { text: "Deposit", bold: true, fillColor: "#f3f4f6" },
      { text: "Net Due", bold: true, fillColor: "#f3f4f6" },
    ],
    ...settlement.breakdown.map((b) => [
      b.name,
      formatIDR(Math.round(b.consumption)),
      formatIDR(Math.round(b.sharedShare)),
      formatIDR(Math.round(b.totalTagihan)),
      formatIDR(Math.round(b.deposit)),
      formatIDR(Math.round(b.netDue)),
    ]),
    [
      { text: "Grand Total", bold: true, colSpan: 3 }, {}, {},
      { text: formatIDR(Math.round(settlement.grandTotal)), bold: true },
      { text: formatIDR(Math.round(settlement.totalDeposit)), bold: true },
      "",
    ],
  ];

  const paymentContent: object[] = [];
  if (pi.bankName || pi.accountNumber || pi.accountName) {
    paymentContent.push({
      text: `Bank: ${pi.bankName ?? "-"}  |  No. Rek: ${pi.accountNumber ?? "-"}  |  Atas Nama: ${pi.accountName ?? "-"}`,
      style: "paymentInfo",
    });
  }
  if (pi.ewallet) paymentContent.push({ text: `E-Wallet: ${pi.ewallet}`, style: "paymentInfo" });
  if (pi.note) paymentContent.push({ text: `Catatan: ${pi.note}`, style: "paymentInfo" });

  const docDefinition = {
    content: [
      { text: session.name, style: "header" },
      { text: date, style: "subheader" },
      "\n",
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto"],
          body: tableBody,
        },
        layout: "lightHorizontalLines",
      },
      ...(paymentContent.length > 0
        ? ["\n", { text: "Info Pembayaran", style: "sectionHeader" }, ...paymentContent]
        : []),
    ],
    styles: {
      header: { fontSize: 16, bold: true, marginBottom: 4 },
      subheader: { fontSize: 10, color: "#666666", marginBottom: 8 },
      sectionHeader: { fontSize: 11, bold: true, marginTop: 8, marginBottom: 4 },
      paymentInfo: { fontSize: 9, color: "#444444" },
    },
    defaultStyle: { fontSize: 9 },
    pageSize: "A4",
    pageMargins: [30, 30, 30, 30],
  };

  const exportDate = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).createPdf(docDefinition).download(`splitbro-${session.name}-${exportDate}.pdf`);
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/export/pdf.ts
git commit -m "feat: add PDF export with pdfmake"
```

---

### Task 8: ExportButtons + Summary Page + Hub

**Files:**
- Create: `components/summary/ExportButtons.tsx`
- Create: `app/(app)/sessions/[id]/summary/page.tsx`
- Modify: `app/(app)/sessions/[id]/page.tsx`

- [ ] **Step 1: Create ExportButtons**

Create `components/summary/ExportButtons.tsx`:

```tsx
"use client";

import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { downloadExcel } from "@/lib/export/excel";
import { downloadPDF } from "@/lib/export/pdf";

type Settlement = { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number };

export function ExportButtons({
  session,
  restaurants,
  itemsByResto,
  sharedCosts,
  settlement,
}: {
  session: Session;
  restaurants: Restaurant[];
  itemsByResto: Record<string, Item[]>;
  sharedCosts: SharedCost[];
  settlement: Settlement;
}) {
  const { t } = useT();
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={() => void downloadExcel(session, restaurants, itemsByResto, sharedCosts, settlement)}
      >
        {t("export.excel")}
      </Button>
      <Button
        variant="secondary"
        onClick={() => void downloadPDF(session, settlement)}
      >
        {t("export.pdf")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create Summary page**

Create `app/(app)/sessions/[id]/summary/page.tsx`:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { getItemRepo } from "@/lib/data/item-repo/index";
import { computeSettlement } from "@/lib/calc/settlement";
import { BreakdownTable } from "@/components/summary/BreakdownTable";
import { ExportButtons } from "@/components/summary/ExportButtons";
import { Button } from "@/components/ui/Button";
import type { Item } from "@/lib/types";

function SummaryInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { restaurants, loading: restoLoading } = useRestaurants(id);
  const { sharedCosts, loading: costsLoading } = useSharedCosts(id);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session || session.mode !== "item_based" || restaurants.length === 0) {
      setItemsByResto({});
      return;
    }
    setItemsLoading(true);
    const repo = getItemRepo();
    Promise.all(
      restaurants.map(async (r) => [r.restaurantId, await repo.list(id, r.restaurantId)] as const)
    ).then((entries) => {
      setItemsByResto(Object.fromEntries(entries));
      setItemsLoading(false);
    });
  }, [id, session?.mode, restaurants]);

  const loading = sessionLoading || restoLoading || costsLoading || itemsLoading;
  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  const settlement = computeSettlement(session, restaurants, itemsByResto, sharedCosts);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/share/${session!.shareToken}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("summary.title")}</h1>

      <BreakdownTable
        breakdown={settlement.breakdown}
        grandTotal={settlement.grandTotal}
        totalDeposit={settlement.totalDeposit}
      />

      <div className="mt-6 flex flex-col gap-3">
        <ExportButtons
          session={session}
          restaurants={restaurants}
          itemsByResto={itemsByResto}
          sharedCosts={sharedCosts}
          settlement={settlement}
        />
        <Button variant="secondary" onClick={() => void handleCopyLink()}>
          {copied ? t("summary.linkCopied") : t("summary.copyLink")}
        </Button>
      </div>
    </main>
  );
}

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <SummaryInner id={id} />
    </AuthGuard>
  );
}
```

- [ ] **Step 3: Add "Lihat Ringkasan" button to hub**

In `app/(app)/sessions/[id]/page.tsx`, find the closing `</div>` of the 4-card nav section and the opening of the status/delete buttons div. Replace:

```tsx
      </div>

      <div className="mt-6 flex gap-2">
```

With:

```tsx
      </div>

      <Link href={`/sessions/${id}/summary`} className="mt-4 block">
        <Button className="w-full">{t("summary.view")}</Button>
      </Link>

      <div className="mt-6 flex gap-2">
```

- [ ] **Step 4: Type-check and run tests**

```
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/summary/ExportButtons.tsx "app/(app)/sessions/[id]/summary/page.tsx" "app/(app)/sessions/[id]/page.tsx"
git commit -m "feat: add summary page with export buttons and hub link"
```

---

### Task 9: Share Page

**Files:**
- Create: `app/share/[token]/page.tsx`

Public read-only page at `/share/[token]`. No `AuthGuard`. Outside the `(app)` route group. Uses `usePublicSession` and the same `BreakdownTable`. Shows payment info below.

- [ ] **Step 1: Create share page**

Create `app/share/[token]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { usePublicSession } from "@/lib/data/use-public-session";
import { computeSettlement } from "@/lib/calc/settlement";
import { BreakdownTable } from "@/components/summary/BreakdownTable";

function PaymentInfoBlock({ session }: { session: Session }) {
  const pi = session.paymentInfo;
  const hasInfo = pi.bankName || pi.accountNumber || pi.accountName || pi.ewallet || pi.note;
  if (!hasInfo) return null;
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      {(pi.bankName || pi.accountNumber || pi.accountName) && (
        <p>
          {[pi.bankName, pi.accountNumber, pi.accountName].filter(Boolean).join(" · ")}
        </p>
      )}
      {pi.ewallet && <p className="mt-1">E-Wallet: {pi.ewallet}</p>}
      {pi.note && <p className="mt-1 text-gray-500">{pi.note}</p>}
    </div>
  );
}

function ShareInner({ token }: { token: string }) {
  const { t } = useT();
  const { session, restaurants, itemsByResto, sharedCosts, loading, notFound } =
    usePublicSession(token);

  if (loading) return null;
  if (notFound || !session) return <p className="p-4">{t("share.notFound")}</p>;

  const settlement = computeSettlement(session, restaurants, itemsByResto, sharedCosts);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-1 text-xl font-bold">{session.name}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("share.title")}</p>
      <BreakdownTable
        breakdown={settlement.breakdown}
        grandTotal={settlement.grandTotal}
        totalDeposit={settlement.totalDeposit}
      />
      <PaymentInfoBlock session={session} />
    </main>
  );
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <ShareInner token={token} />;
}
```

- [ ] **Step 2: Type-check and run tests**

```
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "app/share/[token]/page.tsx"
git commit -m "feat: add public share page for read-only bill report"
```
