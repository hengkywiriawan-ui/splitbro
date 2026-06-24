# SplitBro

Mobile-first PWA for splitting bills across multi-day, multi-restaurant trips. Built for group travel where one admin manages the session and members never need to create accounts.

## Features

- **Two split modes** — choose once at session creation, locked thereafter:
  - **Equal Split** — entire restaurant bill divided evenly among participants
  - **Item-Based Split** — each person pays exactly for what they ordered
- **Per-restaurant tax handling** — supports tax-included and tax-excluded pricing; heavier orderers carry proportionally more PPN in item mode
- **Shared costs** — driver fee, parking, fuel divided evenly across all members in both modes
- **Driver flag** — driver's food consumption redistributed proportionally to non-driver members
- **Deposit tracking** — members can pre-pay; settlement shows who still owes or gets refunded
- **Shareable report link** — read-only report URL valid for 10 days from share date, regeneratable
- **Admin-only auth** — only the host authenticates (Google or Email/Password); members are manual data
- **Admin approval gate** — new accounts require admin approval before login is permitted
- **Bilingual UI** — Bahasa Indonesia + English, user-switchable, persisted in localStorage
- **PWA** — installable on mobile, works offline for cached views
- **Export** — Excel (SheetJS) and PDF (pdfmake) report generation

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 |
| Database | Firestore (Spark free tier) |
| Auth | Firebase Auth (Google + Email/Password) |
| PWA | @ducanh2912/next-pwa / Workbox |
| Export | SheetJS `xlsx` + pdfmake |
| Testing | Vitest + React Testing Library + jsdom |

## Project Structure

```
app/
  (auth)/login/           # Login page (admin only)
  (app)/sessions/         # Session list + create
  (app)/sessions/[id]/    # Session detail
    members/              # Manage trip members
    restaurants/          # Restaurants + items
    shared-costs/         # Shared costs (driver, parking, etc.)
    payment/              # Payment info for the report
    summary/              # Settlement breakdown
  share/[token]/          # Public read-only report (server-validated token)
components/
  ui/                     # Base UI components (Button, Card, Input, Badge, …)
  sessions/               # Session list and form
  members/                # Member management
  restaurants/            # Restaurant and item lists
lib/
  calc/                   # Pure settlement calculation engine
  firebase/               # Firebase init + auth helpers
  data/                   # Repository pattern — sessions, restaurants, items, shared costs
  i18n/                   # ID/EN dictionaries
  export/                 # Excel + PDF generators
  types.ts                # Shared TypeScript types mirroring Firestore schema
```

## Getting Started

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_FIREBASE_* values from your Firebase project
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (run after every code change)
npm test           # run all tests once
npm run test:watch # watch mode
```

> Requires `.env.local` with Firebase config. Copy `.env.example` and fill in the values.

## Testing

Tests use **Vitest** with **React Testing Library** and a **jsdom** environment.

### Test Structure

Tests live next to the code they cover under `__tests__/` directories:

```
lib/calc/__tests__/settlement.test.ts      # calculation engine (pure function)
lib/__tests__/format.test.ts               # IDR formatter
lib/__tests__/types.test.ts                # type helpers
lib/__tests__/members.test.ts              # member utilities
lib/auth/__tests__/                        # auth provider + mock
lib/data/__tests__/                        # session, restaurant, item, shared-cost repos
lib/i18n/__tests__/                        # i18n dictionaries
components/ui/__tests__/                   # Button, Card, Input, Badge, Money, PageHeader
components/sessions/__tests__/             # SessionForm, SessionList
```

### Calculation Engine Tests

The core `computeSettlement` pure function is tested across all scenarios:

| Scenario | What is verified |
|---|---|
| Equal mode — tax excluded | `effectiveTotal = base × (1 + taxRate/100)`, even split |
| Equal mode — tax included | Multiplier = 1, amount unchanged |
| Equal mode — per-restaurant participants | Only listed participants share that bill |
| Item mode — single assign | Full item price attributed to one member |
| Item mode — multi assign | Item price split evenly among assigned members |
| Item mode — proportional tax | Heavier orderer carries proportionally more PPN |
| Shared costs | Divided evenly across all members regardless of mode |
| Deposit — underpay | `netDue > 0` |
| Deposit — overpay | `netDue < 0` |
| Deposit — exact | `netDue = 0` |
| Driver flag — equal mode | Driver's share redistributed to non-drivers |
| Driver flag — item mode | Driver's item consumption passed to non-drivers |
| Driver flag — all drivers | No redistribution |
| Driver flag — shared costs | Driver still pays their share of shared costs |
| Edge cases | Empty session, null totalAmount |

### Running Tests

```bash
npm test                        # run all tests once
npm run test:watch              # watch mode for TDD
npx vitest run lib/calc         # run only calculation engine tests
```

## Calculation Engine

The settlement engine (`lib/calc/settlement.ts`) is a pure function with no side effects:

```ts
computeSettlement(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[]
): { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
```

Key rules:
- **No rounding in calculation** — `Math.round` only at display/export time
- **Tax applied per restaurant** — `taxIncluded: true` → multiplier = 1; `false` → multiply by `(1 + taxRate/100)`
- **Item mode tax is proportional** — each member's raw share scaled by `effectiveTotal / subtotal`
- **Shared costs always split evenly** — regardless of mode or restaurant participation
- **Settlement**: `netDue = consumption + sharedShare − deposit`

## Data Model

Firestore hierarchy:

```
users/{uid}
sessions/{sessionId}               ← embeds members[]
  restaurants/{restaurantId}
    items/{itemId}                  ← item_based mode only
  sharedCosts/{costId}
```

Public report access is server-side only: Next.js route validates `shareToken` before returning data — Firestore is never exposed with public read rules.

## License

Private project.
