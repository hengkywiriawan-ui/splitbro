# Phase 1B — Members, Payment Info & Restaurants: Design Spec

## Goal

Admin can manage trip participants (members), payment instructions, and the list of restaurants (with per-restaurant tax settings) within an existing session.

## Scope

Implements PRD FR-3 (Members), FR-4 (Payment Info), FR-5 (Restaurants). No calculation logic — that is Phase 1C.

---

## 1. New Types (`lib/types.ts`)

```ts
export interface Restaurant {
  restaurantId: string;
  sessionId: string;
  name: string;
  date: string | null;        // "YYYY-MM-DD", optional
  order: number;              // display sort order
  taxIncluded: boolean;       // true = price already includes tax
  taxRate: number;            // % e.g. 11; ignored when taxIncluded=true
  totalAmount: number | null; // equal mode only; null = not yet set
}

export interface NewRestaurantInput {
  sessionId: string;
  name: string;
  date?: string | null;
  order?: number;
  taxIncluded?: boolean;      // default false
  taxRate?: number;           // default = session.defaultTaxRate
  totalAmount?: number | null;
}

export type RestaurantPatch = Partial<Omit<Restaurant, "restaurantId" | "sessionId">>;
```

`Member`, `PaymentInfo`, `Session` shapes are unchanged.

---

## 2. Data Layer

### 2a. RestaurantRepository seam

Mirror the `SessionRepository` pattern exactly.

**`lib/data/restaurant-repo/types.ts`**
```ts
export interface RestaurantRepository {
  list(sessionId: string): Promise<Restaurant[]>;
  get(sessionId: string, restaurantId: string): Promise<Restaurant | null>;
  create(input: NewRestaurantInput): Promise<Restaurant>;
  update(sessionId: string, restaurantId: string, patch: RestaurantPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string): Promise<void>;
}
```

**`lib/data/restaurant-repo/mock-repo.ts`**
- localStorage key: `splitbro:restaurants:{sessionId}` (JSON array of `Restaurant`)
- `restaurantId` generated via `crypto.randomUUID()`
- `order` defaults to `list.length` on create (append)
- Same monotonic-timestamp trick as mock session repo to prevent ordering flakiness

**`lib/data/restaurant-repo/index.ts`**
- `getRestaurantRepo(): RestaurantRepository` factory
- Reads `NEXT_PUBLIC_BACKEND`; throws "firebase not implemented" if not `mock`

**`lib/data/use-restaurants.ts`**
- `useRestaurants(sessionId: string)` hook
- Returns `{ restaurants, loading, add, update, remove, refresh }`

### 2b. Single-session hook

**`lib/data/use-session.ts`**
- `useSession(id: string, adminId: string | null)` hook
- Calls `repo.get(id)` directly (not list-and-filter)
- Returns `{ session, loading, update }` where `update` wraps `repo.update(id, patch)`

### 2c. Pure member helpers (`lib/members.ts`)

```ts
// Generates memberId via crypto.randomUUID()
export function addMember(members: Member[], input: Omit<Member, "memberId">): Member[]

export function updateMember(
  members: Member[],
  memberId: string,
  patch: Partial<Omit<Member, "memberId">>
): Member[]

export function removeMember(members: Member[], memberId: string): Member[]
```

All return new arrays (no mutation). Calling code passes the result to `sessionRepo.update(id, { members })`.

Unit tests cover: add to empty list, add to non-empty, edit name, edit deposit, remove middle item, remove last item.

---

## 3. Navigation Hub

`app/(app)/sessions/[id]/page.tsx` is refactored from a standalone SessionForm edit page into a hub.

### Hub sections (top → bottom)

1. **Back link** → `/sessions`
2. **Session header**: name, mode badge (locked), status badge
3. **Inline session edit**: name + defaultTaxRate fields — same `SessionForm` component, edit mode; mode field stays hidden with lock note
4. **Navigation cards** (3 cards, each a `<Link>`):
   - Members → `/sessions/[id]/members` (shows member count)
   - Payment Info → `/sessions/[id]/payment`
   - Restaurants → `/sessions/[id]/restaurants` (shows restaurant count)
5. **Status toggle** (close/reopen) + **Delete** buttons (existing behaviour)

The three sub-routes each have their own Back link → `/sessions/[id]`.

---

## 4. Members CRUD (`/sessions/[id]/members`)

### Data flow
`useSession(id)` → `session.members[]` → render list.
Mutations: pure helper → new array → `sessionRepo.update(id, { members: newArray })`.

### UX
- List shows: name, deposit (formatted IDR), email/phone if set, Edit button
- Tapping Edit expands an inline form (no modal) with the same fields as Add
- Delete shows inline confirm before removing
- "+ Tambah Peserta" button at bottom opens an inline add form

### MemberForm fields
| Field | Required | Validation |
|---|---|---|
| Nama | ✅ | min 1 char |
| Email | ❌ | valid email format or empty |
| No. HP | ❌ | free text, no validation |
| Deposit | ❌ | number ≥ 0, default 0 |

Deposit is editable at any time (not locked after creation).

### Components
```
components/members/
  MemberForm.tsx   // add + edit (mode prop), calls onSubmit(member fields)
  MemberList.tsx   // list + inline expand + delete confirm
```

---

## 5. Payment Info (`/sessions/[id]/payment`)

### Data flow
`useSession(id)` → `session.paymentInfo` → pre-fill form.
On submit → `sessionRepo.update(id, { paymentInfo })`.
Empty string fields are stored as `null`.

### Fields
All optional, free text:
- Nama Bank
- No. Rekening
- Atas Nama
- E-Wallet
- Catatan

Single Save button; no auto-save.

### Component
```
components/payment/
  PaymentInfoForm.tsx   // 5 controlled fields + save, calls onSubmit(PaymentInfo)
```

---

## 6. Restaurants CRUD (`/sessions/[id]/restaurants`)

### Data flow
`useRestaurants(sessionId)` + `useSession(id)` (reads `mode` and `defaultTaxRate`).

### UX
- List sorted by `order`
- Each card shows: name, date (if set), tax summary line, totalAmount (equal) or "Kelola Item →" placeholder (item_based)
- Edit expands inline form; Delete shows inline confirm

### RestaurantForm fields
| Field | Condition | Default |
|---|---|---|
| Nama | always, required | — |
| Tanggal | always, optional | null |
| Harga sudah include PPN? | always | false |
| Tarif PPN (%) | only when taxIncluded = false | session.defaultTaxRate |
| Total tagihan (IDR) | equal mode only | null |

When `taxIncluded = true`, taxRate field is **not rendered** (hidden, not just disabled). The stored taxRate retains its last value for future reference.

Item mode: no totalAmount field; instead shows a disabled button "Kelola Item — tersedia di fase berikutnya".

### Components
```
components/restaurants/
  RestaurantForm.tsx   // controlled, mode-aware, taxIncluded toggle controls taxRate visibility
  RestaurantList.tsx   // list + inline expand + delete confirm
```

---

## 7. i18n Keys (additions to `lib/i18n/dictionaries.ts`)

New key groups (both `id` and `en` dictionaries):

```
session.hub.members        Peserta / Members
session.hub.payment        Info Pembayaran / Payment Info
session.hub.restaurants    Restoran / Restaurants

member.title               Peserta / Members
member.add                 Tambah Peserta / Add Member
member.edit.title          Ubah Peserta / Edit Member
member.empty               Belum ada peserta. / No members yet.
member.field.name          Nama / Name
member.field.name.required Nama wajib diisi. / Name is required.
member.field.email         Email
member.field.phone         No. HP / Phone
member.field.deposit       Deposit (IDR)
member.delete.confirm      Hapus peserta ini? / Remove this member?

payment.title              Info Pembayaran / Payment Info
payment.field.bankName     Nama Bank / Bank Name
payment.field.accountNumber No. Rekening / Account Number
payment.field.accountName  Atas Nama / Account Name
payment.field.ewallet      E-Wallet
payment.field.note         Catatan / Note

restaurant.title           Restoran / Restaurants
restaurant.add             Tambah Restoran / Add Restaurant
restaurant.edit.title      Ubah Restoran / Edit Restaurant
restaurant.empty           Belum ada restoran. / No restaurants yet.
restaurant.field.name      Nama Restoran / Restaurant Name
restaurant.field.date      Tanggal / Date
restaurant.field.taxIncluded Harga sudah include PPN? / Price includes tax?
restaurant.field.taxRate   Tarif PPN (%) / VAT rate (%)
restaurant.field.totalAmount Total Tagihan (IDR) / Total Bill (IDR)
restaurant.items.placeholder Kelola Item — tersedia di fase berikutnya / Manage Items — available in next phase
restaurant.delete.confirm  Hapus restoran ini? / Delete this restaurant?
```

---

## 8. Invariants

- All new UI strings go through `useT()` — no hardcoded text.
- `formatIDR()` used for all IDR display.
- `taxRate` field hidden (not just disabled) when `taxIncluded = true`.
- Restaurant `order` is append-only in 1B; drag-to-reorder is out of scope.
- `memberId` and `restaurantId` generated via `crypto.randomUUID()`.
- No cascade delete warning for members/restaurants in 1B (items handled in 1C).
- `npx tsc --noEmit` must pass after every task.

---

## 9. Out of Scope (1B)

- Item management (Phase 1C)
- Settlement calculation (Phase 1C)
- Firebase backend (deferred until Firebase wiring slice)
- Reordering restaurants via drag
- Member delete warning when member has assigned items
