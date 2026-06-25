# SplitBro

Mobile-first PWA for splitting bills across multi-day, multi-restaurant trips. Built for group travel where one admin manages the session and members never need to create accounts.

## Features

- **Two split modes** — chosen once at session creation, locked thereafter:
  - **Equal Split** — entire restaurant bill divided evenly among participants; supports per-restaurant participant subsets
  - **Item-Based Split** — each person pays for what they ordered; heavier orderers carry proportionally more PPN
- **Per-restaurant tax handling** — `taxIncluded` flag; live PPN preview while adding a restaurant
- **Shared costs** — driver fee, parking, fuel divided evenly across all members in both modes
- **Driver flag** — driver's food consumption redistributed to non-driver members; driver still pays their share of shared costs
- **Deposit tracking** — members can pre-pay; settlement shows who still owes or gets refunded
- **OCR receipt scanning** — Gemini 2.5 Flash reads receipt photos; sharp preprocesses (auto-rotate + resize) for accuracy
- **Shareable report link** — read-only URL with 10-day expiry from share date; admin can regenerate; accordion grouped by date
- **Admin-only auth** — only the host authenticates (Google or Email/Password); members are manual data
- **Approval gate** — new accounts auto-approved; admin revokes access by setting `approved=false` in Firestore
- **Bilingual UI** — Bahasa Indonesia + English, user-switchable, persisted in localStorage
- **PWA** — installable on mobile, offline-capable for cached views
- **Export** — Excel (SheetJS) and PDF (pdfmake) report generation

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 |
| Database | Firestore (Spark free tier) |
| Auth | Firebase Auth (Google + Email/Password) |
| Admin SDK | firebase-admin (Firestore + Auth — isolated modules) |
| OCR | Google Gemini 2.5 Flash + sharp (image preprocessing) |
| PWA | @ducanh2912/next-pwa / Workbox |
| Export | SheetJS `xlsx` + pdfmake |
| Testing | Vitest + React Testing Library + jsdom |
| Deployment | Vercel (Hobby free tier) |

## Architecture

### Backend Switch

`NEXT_PUBLIC_BACKEND=mock|firebase` controls the data layer at build time.

- **mock** — data persisted to `localStorage` (no Firebase required for local dev)
- **firebase** — Firestore + Firebase Auth

Each domain exports a factory that picks the right implementation:

```
lib/data/
  sessions/         getSessionRepo()       → MockSessionRepo | FirebaseSessionRepo
  restaurant-repo/  getRestaurantRepo()    → MockRestaurantRepo | FirebaseRestaurantRepo
  item-repo/        getItemRepo()          → MockItemRepo | FirebaseItemRepo
  shared-cost-repo/ getSharedCostRepo()    → MockSharedCostRepo | FirebaseSharedCostRepo
lib/auth/
  provider.tsx      getAuthProvider()      → mockAuthProvider | firebaseAuthProvider
```

### Firebase Admin Isolation

`firebase-admin/auth` pulls in `jwks-rsa → jose` (ESM-only), which crashes Turbopack's `require()`. Admin SDK is split into two modules:

| Module | Exports | Used by |
|---|---|---|
| `lib/firebase/admin.ts` | `getAdminDb()` (Firestore only) | `api/share/[token]` |
| `lib/firebase/admin-auth.ts` | `getAdminAuth()` | `api/ocr` |

`next.config.ts` externalizes firebase-admin from the bundler via `serverExternalPackages`.

### Security

- Firestore rules gate all writes on `request.auth.uid == adminId`
- Public report access goes through `app/api/share/[token]/route.ts` (server-side) — Firestore has no public read rules
- `sanitizeMembers()` strips `email`/`phone` from the public report response
- OCR endpoint requires a Firebase ID token (admin only)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options DENY`, `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin-allow-popups` (required for Google popup auth)
- `FIREBASE_SERVICE_ACCOUNT_JSON` and `GEMINI_API_KEY` are server-side only (never `NEXT_PUBLIC_*`)

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
  api/
    share/[token]/        # Public read-only report API (token-validated, server-side)
    ocr/                  # Receipt OCR via Gemini Flash (admin auth required)
  share/[token]/          # Public report page
components/
  ui/                     # Base UI primitives (Button, Card, Input, Badge, Money, PageHeader)
  auth/                   # LoginForm
  sessions/               # SessionForm, SessionList
  members/                # MemberForm, MemberList
  restaurants/            # RestaurantForm, RestaurantList, ItemForm
  share/                  # RestaurantReport (accordion, grouped by date)
lib/
  calc/                   # Pure settlement calculation engine
  firebase/               # Firebase client config, admin.ts, admin-auth.ts
  auth/                   # Auth provider + factory (mock / firebase)
  data/                   # Repository pattern — sessions, restaurants, items, shared costs
  i18n/                   # ID/EN dictionaries + provider
  export/                 # Excel + PDF generators
  types.ts                # Shared TypeScript types mirroring Firestore schema
```

## Getting Started

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_FIREBASE_* from your Firebase project
npm install
npm run dev
```

For mock mode (no Firebase):

```bash
NEXT_PUBLIC_BACKEND=mock npm run dev
```

## Scripts

```bash
npm run dev        # local dev server (Turbopack)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (run after every code change)
npm test           # run all tests once
npm run test:watch # watch mode
```

## Deployment

Deployed on **Vercel** (Hobby). Required environment variables in Vercel dashboard:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BACKEND` | `firebase` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full service account JSON (server-side only) |
| `GEMINI_API_KEY` | Google AI Studio key (server-side only) |

After updating Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Testing

Tests use **Vitest** with **React Testing Library** and a **jsdom** environment. TDD workflow: write tests first (RED), implement to pass (GREEN), refactor (IMPROVE). Target: 80%+ coverage.

### Test Structure

```
lib/calc/__tests__/settlement.test.ts               # calculation engine — all scenarios
lib/__tests__/format.test.ts                        # IDR formatter
lib/__tests__/types.test.ts                         # type guard helpers
lib/__tests__/members.test.ts                       # member utilities
lib/auth/__tests__/mock-auth.test.ts                # auth provider + mock backend
lib/data/__tests__/mock-repo.test.ts                # session repository
lib/data/restaurant-repo/__tests__/mock-repo.test.ts
lib/data/item-repo/__tests__/mock-repo.test.ts
lib/data/shared-cost-repo/__tests__/mock-repo.test.ts
lib/i18n/__tests__/dictionaries.test.ts             # ID + EN key coverage
```

### Calculation Engine Test Scenarios

The core `computeSettlement` pure function covers:

| Scenario | What is verified |
|---|---|
| Equal — tax excluded | `effectiveTotal = base × (1 + taxRate/100)`, even split |
| Equal — tax included | Multiplier = 1, amount unchanged |
| Equal — per-restaurant participants | Only listed participants share that bill |
| Item — single assign | Full item price to one member |
| Item — multi assign | Item price split evenly among assigned members |
| Item — proportional tax | Heavier orderer carries proportionally more PPN |
| Shared costs | Divided evenly across all members regardless of mode |
| Deposit — underpay | `netDue > 0` |
| Deposit — overpay | `netDue < 0` |
| Deposit — exact | `netDue = 0` |
| Driver — equal mode | Driver's share redistributed to non-drivers |
| Driver — item mode | Driver's item consumption redistributed to non-drivers |
| Driver — all drivers | No redistribution (no-op) |
| Driver — shared costs | Driver still pays their share of shared costs |
| Edge cases | Empty session, null totalAmount |

### Running Tests

```bash
npm test                          # all tests
npm run test:watch                # watch mode for TDD
npx vitest run lib/calc           # calculation engine only
npx vitest run lib/data           # repository layer only
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
- **No rounding in calculation** — `Math.round` only at display/export via `formatIDR()`
- **Tax per restaurant** — `taxIncluded: true` → multiplier = 1; `false` → multiply by `(1 + taxRate/100)`
- **Item mode tax is proportional** — each member's raw share scaled by `effectiveTotal / subtotal`
- **Shared costs always split evenly** — regardless of mode or restaurant participation
- **Driver redistribution** — driver's consumption spread evenly to non-drivers; no-op if all members are drivers
- **Settlement**: `netDue = consumption + sharedShare − deposit`

## Data Model

Firestore hierarchy:

```
users/{uid}
  uid, email, displayName, photoURL, approved: boolean, createdAt

sessions/{sessionId}                         ← embeds members[]
  name, adminId, mode, currency, defaultTaxRate, status
  shareToken, shareExpiresAt (epoch ms, 10 days from share)
  paymentInfo { bankName, accountNumber, accountName, ewallet, note }
  members[] { memberId, name, email, phone, deposit, isDriver }

  restaurants/{restaurantId}
    name, date, order, taxIncluded, taxRate
    totalAmount (equal mode), participantIds[] (equal mode, empty = all)

    items/{itemId}                           ← item_based mode only
      name, price, assignedTo[]

  sharedCosts/{costId}
    name, amount
```

Public report access is server-side only: `app/api/share/[token]/route.ts` validates `shareToken` and `shareExpiresAt` before returning data. Member PII (`email`, `phone`) is stripped before the response. Firestore has no public read rules.

## License

Private project.
