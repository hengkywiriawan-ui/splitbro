# Phase 1C — Items, Shared Costs & Calculation Engine: Design Spec

## Goal

Admin can input item orders (item_based mode), add shared trip costs, and the app computes an accurate settlement breakdown per member using a pure calculation engine.

## Scope

Implements PRD FR-6 (Items), FR-7 (Shared Costs), and the calculation engine (PRD section 6). No settlement display UI — that is Phase 1D which consumes `computeSettlement` from this phase.

---

## 1. New Types (`lib/types.ts`)

```ts
export interface Item {
  itemId: string;
  sessionId: string;
  restaurantId: string;
  name: string;
  price: number;          // total price for the item, not per person
  assignedTo: string[];   // memberId[], validated min 1 before save
}

export interface NewItemInput {
  sessionId: string;
  restaurantId: string;
  name: string;
  price: number;
  assignedTo: string[];
}

export type ItemPatch = Partial<Omit<Item, "itemId" | "sessionId" | "restaurantId">>;

export interface SharedCost {
  costId: string;
  sessionId: string;
  name: string;
  amount: number;
}

export interface NewSharedCostInput {
  sessionId: string;
  name: string;
  amount: number;
}

export type SharedCostPatch = Partial<Omit<SharedCost, "costId" | "sessionId">>;
```

---

## 2. Data Layer

### 2a. ItemRepository seam

Mirror the `RestaurantRepository` pattern exactly.

**`lib/data/item-repo/types.ts`**
```ts
export interface ItemRepository {
  list(sessionId: string, restaurantId: string): Promise<Item[]>;
  get(sessionId: string, restaurantId: string, itemId: string): Promise<Item | null>;
  create(input: NewItemInput): Promise<Item>;
  update(sessionId: string, restaurantId: string, itemId: string, patch: ItemPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string, itemId: string): Promise<void>;
}
```

**`lib/data/item-repo/mock-repo.ts`**
- localStorage key: `splitbro:items:{sessionId}:{restaurantId}` (per-restaurant isolation)
- `itemId` via `crypto.randomUUID()`
- `typeof window === "undefined"` guard

**`lib/data/item-repo/index.ts`**
- `getItemRepo(): ItemRepository` factory — reads `NEXT_PUBLIC_BACKEND`, throws if `firebase`

**`lib/data/use-items.ts`**
- `useItems(sessionId: string, restaurantId: string)`
- Returns `{ items, loading, add, update, remove, refresh }`

### 2b. SharedCostRepository seam

**`lib/data/shared-cost-repo/types.ts`**
```ts
export interface SharedCostRepository {
  list(sessionId: string): Promise<SharedCost[]>;
  get(sessionId: string, costId: string): Promise<SharedCost | null>;
  create(input: NewSharedCostInput): Promise<SharedCost>;
  update(sessionId: string, costId: string, patch: SharedCostPatch): Promise<void>;
  delete(sessionId: string, costId: string): Promise<void>;
}
```

**`lib/data/shared-cost-repo/mock-repo.ts`**
- localStorage key: `splitbro:sharedcosts:{sessionId}`
- `costId` via `crypto.randomUUID()`

**`lib/data/shared-cost-repo/index.ts`**
- `getSharedCostRepo(): SharedCostRepository` factory

**`lib/data/use-shared-costs.ts`**
- `useSharedCosts(sessionId: string)`
- Returns `{ sharedCosts, loading, add, update, remove, refresh }`

---

## 3. Navigation Changes

### 3a. Session Hub (`app/(app)/sessions/[id]/page.tsx`)

Add 4th nav card after "Restoran":

```tsx
<Link href={`/sessions/${id}/shared-costs`}>
  <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
    <span className="font-medium">{t("sharedCost.hub.label")}</span>
    <span className="text-gray-500">{sharedCosts.length} →</span>
  </Card>
</Link>
```

Hub imports `useSharedCosts(id)` to get the count.

### 3b. RestaurantList (`components/restaurants/RestaurantList.tsx`)

Add `sessionId` prop. In `item_based` mode, each restaurant card wraps in `<Link href={/sessions/${sessionId}/restaurants/${r.restaurantId}}>`. In `equal` mode, no link.

The "Kelola Item" placeholder text in `RestaurantForm` remains (it is shown inside the form, not the list card).

---

## 4. New Routes

### 4a. Items page — `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx`

- Uses `useSession(id, adminId)` + `useItems(id, restaurantId)`
- Mode guard: if `session.mode === "equal"`, render `<p>{t("item.equalModeOnly")}</p>` and a back link — no item management
- Back link → `/sessions/[id]/restaurants` (label: `← {t("restaurant.title")}`, no extra hook needed)
- Shows `ItemList`, then "+ Tambah Item" button

### 4b. Shared costs page — `app/(app)/sessions/[id]/shared-costs/page.tsx`

- Uses `useSession(id, adminId)` + `useSharedCosts(id)`
- No mode guard — applies to both modes
- Back link → `/sessions/[id]`
- Shows `SharedCostList`, then "+ Tambah Biaya Bersama" button

---

## 5. Components

### 5a. ItemForm (`components/items/ItemForm.tsx`)

Fields:

| Field | Required | Validation |
|---|---|---|
| Nama menu | ✅ | min 1 char |
| Harga | ✅ | number ≥ 0 |
| Assign ke | ✅ | checkbox per member, min 1 checked |

When >1 member checked: show inline note `"Harga dibagi rata ke N orang"` (display only, price stored as total).

Props: `{ initial?, members: Member[], onSubmit, onCancel? }`

### 5b. ItemList (`components/items/ItemList.tsx`)

Same inline-expand pattern as `MemberList`. Each card shows: name, `formatIDR(price)`, assigned member names (joined by ", "). Edit expands `ItemForm`. Delete shows inline confirm.

Props: `{ items: Item[], members: Member[], onUpdate, onRemove }`

### 5c. SharedCostForm (`components/shared-costs/SharedCostForm.tsx`)

Fields:

| Field | Required | Validation |
|---|---|---|
| Nama | ✅ | min 1 char (e.g. "Driver", "Parkir") |
| Jumlah | ✅ | number ≥ 0, IDR |

Props: `{ initial?, onSubmit, onCancel? }`

### 5d. SharedCostList (`components/shared-costs/SharedCostList.tsx`)

Same inline-expand pattern. Each card shows: name, `formatIDR(amount)`. Edit expands `SharedCostForm`. Delete shows inline confirm.

Props: `{ sharedCosts: SharedCost[], onUpdate, onRemove }`

---

## 6. Calculation Engine

### 6a. Pure function

File: `lib/calc/settlement.ts`

Zero imports from React, UI, or any side-effecting module. Accepts full session data, returns breakdown.

```ts
export type Breakdown = {
  memberId: string;
  name: string;
  consumption: number;
  sharedShare: number;
  totalTagihan: number;
  deposit: number;
  netDue: number;
};

export function computeSettlement(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,   // restaurantId → Item[]
  sharedCosts: SharedCost[]
): {
  breakdown: Breakdown[];
  grandTotal: number;
  totalDeposit: number;
}
```

### 6b. Algorithm (implement verbatim from `.claude/rules/calculation-engine.md`)

```
applyTax(base, r):
  if r.taxIncluded → return base
  else → return base * (1 + r.taxRate / 100)

Equal mode:
  for each restaurant r:
    effectiveTotal = applyTax(r.totalAmount, r)
    sharePerMember = effectiveTotal / N
    each member: consumption[m] += sharePerMember

Item mode:
  for each restaurant r:
    rawShare = {} per member
    subtotal = 0
    for each item i:
      k = i.assignedTo.length
      pricePerHead = i.price / k
      each assignee: rawShare[m] += pricePerHead
      subtotal += i.price
    if subtotal > 0:
      effectiveTotal = applyTax(subtotal, r)
      taxMultiplier = effectiveTotal / subtotal
      each member: consumption[m] += rawShare[m] * taxMultiplier

Shared costs (both modes):
  for each sharedCost c:
    perMember = c.amount / N
    each member: sharedShare[m] += perMember

Settlement:
  totalTagihan[m] = consumption[m] + sharedShare[m]
  netDue[m] = totalTagihan[m] - m.deposit

grandTotal = Σ totalTagihan
totalDeposit = Σ deposit
```

No `Math.round` anywhere in this function. Rounding only at display/export time.

### 6c. Unit tests (`lib/calc/__tests__/settlement.test.ts`)

Required scenarios:

1. **Equal mode, tax excluded** — 2 members, 1 restaurant, `taxIncluded=false`, `taxRate=11` → each member gets `(totalAmount * 1.11) / 2`
2. **Equal mode, tax included** — same but `taxIncluded=true` → each member gets `totalAmount / 2` (taxMultiplier=1)
3. **Item mode, single-assign** — item assigned to 1 person → full price to that person
4. **Item mode, multi-assign** — item assigned to 2 of 3 people → price split evenly between those 2
5. **Item mode, proportional tax** — 2 members order different amounts; heavier orderer carries proportionally more PPN
6. **Shared cost, both modes** — shared cost divided evenly regardless of consumption
7. **Deposit underpay** — `netDue > 0`
8. **Deposit overpay** — `netDue < 0`
9. **Deposit exact** — `netDue == 0`

---

## 7. i18n Keys (additions to `lib/i18n/dictionaries.ts`)

```
sharedCost.hub.label      Biaya Bersama / Shared Costs
sharedCost.title          Biaya Bersama / Shared Costs
sharedCost.add            Tambah Biaya Bersama / Add Shared Cost
sharedCost.edit.title     Ubah Biaya Bersama / Edit Shared Cost
sharedCost.empty          Belum ada biaya bersama. / No shared costs yet.
sharedCost.field.name     Nama / Name
sharedCost.field.name.required  Nama wajib diisi. / Name is required.
sharedCost.field.amount   Jumlah (IDR) / Amount (IDR)
sharedCost.field.amount.required  Jumlah wajib diisi. / Amount is required.
sharedCost.delete.confirm Hapus biaya ini? / Delete this cost?

item.title                Item / Items
item.add                  Tambah Item / Add Item
item.edit.title           Ubah Item / Edit Item
item.empty                Belum ada item. / No items yet.
item.field.name           Nama Menu / Menu Item
item.field.name.required  Nama menu wajib diisi. / Menu item name is required.
item.field.price          Harga (IDR) / Price (IDR)
item.field.price.required Harga wajib diisi. / Price is required.
item.field.assignTo       Assign ke / Assign to
item.field.assignTo.required  Pilih minimal 1 orang. / Select at least 1 person.
item.splitNote.prefix     Harga dibagi rata ke / Price split evenly across
item.splitNote.suffix     orang / people
item.delete.confirm       Hapus item ini? / Delete this item?
item.equalModeOnly        Item hanya tersedia di mode item-based. / Items are only available in item-based mode.
```

---

## 8. Invariants

- `assignedTo` must have ≥1 entry — validated in `ItemForm` before submit and in `mock-repo.create`
- Items only exist in `item_based` sessions — the items page guards against `equal` mode
- `computeSettlement` is a pure function — no side effects, no React imports
- No `Math.round` inside `computeSettlement`
- All UI strings through `useT()`; all IDR display through `formatIDR()`
- `npx tsc --noEmit` must pass after every task

---

## 9. Out of Scope (1C)

- Settlement display UI (Phase 1D)
- OCR scan for items (Phase 1E)
- Firebase backend for items/shared costs (deferred)
- Reassign/warn on member delete when items assigned (noted in PRD but deferred to Firebase slice)
- Drag-to-reorder items
