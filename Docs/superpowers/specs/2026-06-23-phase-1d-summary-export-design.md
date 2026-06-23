# Phase 1D — Ringkasan, Export & Share: Design Spec

## Goal

Admin dapat melihat hasil settlement per member, mengunduh laporan (Excel/PDF), dan membagikan link read-only ke anggota trip — tanpa login.

## Scope

Implements PRD FR-8 (Settlement Summary) dan FR-9.1–FR-9.3 (Export Excel, PDF, Share Link). FR-9.4 (WhatsApp share) di-skip — di luar scope fase ini.

---

## 1. Routes Baru

| Route | Auth | Fungsi |
|---|---|---|
| `/sessions/[id]/summary` | Required (AuthGuard) | Settlement summary + export + share |
| `/share/[token]` | None (public) | Read-only report untuk member |

Hub page (`/sessions/[id]`) dimodifikasi: tambah tombol "Lihat Ringkasan" prominent di bawah 4 kartu existing.

---

## 2. Data Flow

### Summary page

```
useSession(id, uid)
useRestaurants(id)
useItems(id, restaurantId)  ← per restaurant, skip jika mode equal
useSharedCosts(id)
  → computeSettlement(session, restaurants, itemsByResto, sharedCosts)
  → BreakdownTable (display Math.round only here)
```

### Share page

```
usePublicSession(token)       ← findByShareToken(token) dari session repo
  → load restaurants + items + sharedCosts by sessionId
  → computeSettlement(...)
  → BreakdownTable (read-only)
  → PaymentInfo (display only)
```

---

## 3. Perubahan Existing

### `lib/data/session-repo/types.ts`

Tambah 1 method ke `SessionRepository` interface:

```ts
findByShareToken(token: string): Promise<Session | null>;
```

### `lib/data/session-repo/mock-repo.ts`

Implementasi: scan semua localStorage keys `splitbro:sessions:*`, return session dengan `shareToken === token`.

```ts
async findByShareToken(token: string): Promise<Session | null> {
  if (typeof window === "undefined") return null;
  const keys = Object.keys(localStorage).filter(k => k.startsWith("splitbro:sessions:"));
  for (const key of keys) {
    const sessions: Session[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    const found = sessions.find(s => s.shareToken === token);
    if (found) return found;
  }
  return null;
}
```

### `app/(app)/sessions/[id]/page.tsx` (Session Hub)

Tambah tombol di bawah 4 kartu existing:

```tsx
<Link href={`/sessions/${id}/summary`}>
  <Button className="w-full mt-4">{t("summary.view")}</Button>
</Link>
```

---

## 4. New Files

### `lib/data/use-public-session.ts`

```ts
"use client";
export function usePublicSession(token: string) {
  // useState: session, restaurants, itemsByResto, sharedCosts, loading
  // useEffect:
  //   1. findByShareToken(token) → session
  //   2. getRestaurantRepo().list(session.id) → restaurants
  //   3. if session.mode === "item_based":
  //        for each restaurant: getItemRepo().list(session.id, r.restaurantId)
  //        build itemsByResto: Record<restaurantId, Item[]>
  //      else: itemsByResto = {}
  //   4. getSharedCostRepo().list(session.id) → sharedCosts
  // returns { session, restaurants, itemsByResto, sharedCosts, loading }
}
```

### `components/summary/BreakdownTable.tsx`

Props: `{ breakdown: Breakdown[], grandTotal: number, totalDeposit: number }`

Layout per member (Card, collapsible):
- **Default: collapsed** — hanya tampilkan nama + netDue badge
- Expanded (tap/click card): tabel konsumsi | biaya bersama | total | deposit | net

NetDue display:
- `> 0` → label `t("summary.netDue.owe")`, `text-red-600`
- `< 0` → label `t("summary.netDue.refund")`, `text-green-600`
- `== 0` → label `t("summary.netDue.settled")`, `text-gray-500`

Semua nilai dibulatkan `Math.round` + `formatIDR` saat render. Tidak ada pembulatan di `computeSettlement`.

Footer: Grand Total + Total Deposit.

### `components/summary/ExportButtons.tsx`

Props: `{ session, restaurants, itemsByResto, sharedCosts, settlement }`

Dua tombol: `[Unduh Excel]` `[Unduh PDF]` — trigger `downloadExcel` / `downloadPDF` on click.

### `lib/export/excel.ts`

```ts
import * as XLSX from "xlsx";

export function downloadExcel(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[],
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): void
```

Struktur workbook (2 sheet):

**Sheet "Ringkasan":**
| Nama | Konsumsi | Biaya Bersama | Total Tagihan | Deposit | Net Due |
(satu baris per member + baris total di bawah)

**Sheet "Detail":**
- Equal mode: Restoran | Tanggal | Total | Per Orang
- Item mode: Restoran | Item | Harga | Assigned To | Subtotal Per Orang
- Diikuti baris Biaya Bersama per item

Info pembayaran: blok teks di bawah sheet Ringkasan (baris kosong separator).

Filename: `splitbro-{session.name}-{YYYY-MM-DD}.xlsx`

### `lib/export/pdf.ts`

```ts
import pdfMake from "pdfmake/build/pdfmake";

export function downloadPDF(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[],
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): void
```

Struktur dokumen:
1. Header: nama session + tanggal export
2. Tabel settlement per member (sama dengan sheet Ringkasan)
3. Separator
4. Info Pembayaran (bankName, accountNumber, accountName, ewallet, note)

Filename: `splitbro-{session.name}-{YYYY-MM-DD}.pdf`

### `app/(app)/sessions/[id]/summary/page.tsx`

```
AuthGuard → HubInner
  load: session + restaurants + items + sharedCosts
  compute: computeSettlement(...)
  render:
    ← back link ke /sessions/[id]
    BreakdownTable
    ExportButtons
    "Salin Link" button (copy shareToken URL to clipboard)
```

"Salin Link": `navigator.clipboard.writeText(window.location.origin + "/share/" + session.shareToken)`. Setelah copy: tampilkan feedback singkat (teks berubah jadi "Tersalin!" selama 2 detik).

### `app/share/[token]/page.tsx`

Public page, tidak dalam route group `(app)`, no AuthGuard.

```
usePublicSession(token)
  loading → spinner/null
  not found → pesan "Laporan tidak ditemukan"
  found →
    header: nama session
    BreakdownTable (read-only, sama dengan summary page)
    PaymentInfo (display only)
```

---

## 5. i18n Keys (tambahan)

```
summary.view              Lihat Ringkasan / View Summary
summary.title             Ringkasan Tagihan / Bill Summary
summary.grandTotal        Grand Total / Grand Total
summary.totalDeposit      Total Deposit / Total Deposit
summary.field.consumption Konsumsi / Consumption
summary.field.sharedShare Biaya Bersama / Shared Costs
summary.field.total       Total Tagihan / Total Bill
summary.field.deposit     Deposit / Deposit
summary.netDue.owe        Harus Bayar / Must Pay
summary.netDue.refund     Uang Kembali / Refund
summary.netDue.settled    Lunas / Settled
summary.copyLink          Salin Link Laporan / Copy Report Link
summary.linkCopied        Tersalin! / Copied!
export.excel              Unduh Excel / Download Excel
export.pdf                Unduh PDF / Download PDF
share.title               Laporan Tagihan / Bill Report
share.notFound            Laporan tidak ditemukan. / Report not found.
```

---

## 6. Constraints

- `computeSettlement` tidak berubah — pure function dari Phase 1C
- `Math.round` + `formatIDR` hanya di render layer (BreakdownTable, export functions)
- Export functions: client-side only, no server needed
- Share link mock: localStorage-only → hanya berfungsi di device yang sama
- BreakdownTable reused di summary page DAN share page (same component, read-only both)
- Tidak ada WhatsApp share (FR-9.4 di-skip)

---

## 7. Out of Scope (1D)

- WhatsApp share (FR-9.4)
- Firebase backend untuk share (server-side token validation) — Phase Firebase
- Session status "closed" enforcement pada share page — Phase Firebase
- Email distribusi laporan
