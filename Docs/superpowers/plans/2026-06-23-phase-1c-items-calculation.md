# Phase 1C — Items, Shared Costs & Calculation Engine: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can input item orders (item_based mode), manage shared trip costs, and the app computes an accurate settlement breakdown via a pure, tested calculation engine.

**Architecture:** Two new repository seams (`item-repo`, `shared-cost-repo`) mirror the existing `RestaurantRepository` pattern. The calculation engine is a pure function in `lib/calc/settlement.ts` with no UI imports. The session hub gains a 4th nav card; RestaurantList gains item navigation links in item_based mode.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind · Vitest · localStorage mock

---

## File Map

**Create:**
- `lib/data/item-repo/types.ts`
- `lib/data/item-repo/mock-repo.ts`
- `lib/data/item-repo/index.ts`
- `lib/data/item-repo/__tests__/mock-repo.test.ts`
- `lib/data/shared-cost-repo/types.ts`
- `lib/data/shared-cost-repo/mock-repo.ts`
- `lib/data/shared-cost-repo/index.ts`
- `lib/data/shared-cost-repo/__tests__/mock-repo.test.ts`
- `lib/data/use-items.ts`
- `lib/data/use-shared-costs.ts`
- `lib/calc/settlement.ts`
- `lib/calc/__tests__/settlement.test.ts`
- `components/shared-costs/SharedCostForm.tsx`
- `components/shared-costs/SharedCostList.tsx`
- `components/items/ItemForm.tsx`
- `components/items/ItemList.tsx`
- `app/(app)/sessions/[id]/shared-costs/page.tsx`
- `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx`

**Modify:**
- `lib/types.ts` — add `Item`, `NewItemInput`, `ItemPatch`, `SharedCost`, `NewSharedCostInput`, `SharedCostPatch`
- `lib/__tests__/types.test.ts` — add Item + SharedCost shape tests
- `lib/i18n/dictionaries.ts` — add `item.*`, `sharedCost.*`, `session.hub.sharedCosts` keys
- `app/(app)/sessions/[id]/page.tsx` — add 4th hub nav card + `useSharedCosts`
- `components/restaurants/RestaurantList.tsx` — add `sessionId` prop, item navigation link in item_based mode

---

## Task 1: New Types

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Write failing type-shape tests**

Append to `lib/__tests__/types.test.ts` after the existing tests:

```ts
import type { Item, NewItemInput, ItemPatch, SharedCost, SharedCostPatch } from "@/lib/types";

it("constructs an Item with all required fields", () => {
  const item: Item = {
    itemId: "i1",
    sessionId: "s1",
    restaurantId: "r1",
    name: "Ayam Goreng",
    price: 25000,
    assignedTo: ["m1", "m2"],
  };
  expect(item.itemId).toBe("i1");
  expect(item.assignedTo).toHaveLength(2);
});

it("ItemPatch omits immutable fields", () => {
  const patch: ItemPatch = { name: "Updated", price: 30000, assignedTo: ["m1"] };
  expect(patch.price).toBe(30000);
});

it("constructs a SharedCost with all required fields", () => {
  const sc: SharedCost = { costId: "c1", sessionId: "s1", name: "Driver", amount: 50000 };
  expect(sc.costId).toBe("c1");
  expect(sc.amount).toBe(50000);
});

it("SharedCostPatch omits immutable fields", () => {
  const patch: SharedCostPatch = { name: "Parking", amount: 20000 };
  expect(patch.amount).toBe(20000);
});
```

- [ ] **Step 2: Run — expect FAIL (types not found)**

```
npx vitest run lib/__tests__/types.test.ts
```

Expected: FAIL — `Item` not found in `@/lib/types`.

- [ ] **Step 3: Append types to `lib/types.ts`**

Append after the `RestaurantPatch` export at the end of the file:

```ts
export interface Item {
  itemId: string;
  sessionId: string;
  restaurantId: string;
  name: string;
  price: number;        // total price for the item, not per person
  assignedTo: string[]; // memberId[], min 1
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

- [ ] **Step 4: Run — expect PASS**

```
npx vitest run lib/__tests__/types.test.ts
```

- [ ] **Step 5: Type check**

```
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```
git add lib/types.ts lib/__tests__/types.test.ts
git commit -m "feat: add Item, SharedCost types"
```

---

## Task 2: i18n Keys

**Files:**
- Modify: `lib/i18n/dictionaries.ts`

The parity test at `lib/i18n/__tests__/dictionaries.test.ts` enforces that `id` and `en` have identical keys and no empty strings. Run it before and after.

- [ ] **Step 1: Confirm parity test passes**

```
npx vitest run lib/i18n/__tests__/dictionaries.test.ts
```

- [ ] **Step 2: Add keys to both dictionaries**

In the `id` dictionary, append after `"restaurant.tax.included"` (before the closing `},`):

```ts
    "session.hub.sharedCosts": "Biaya Bersama",
    "sharedCost.title": "Biaya Bersama",
    "sharedCost.add": "Tambah Biaya Bersama",
    "sharedCost.edit.title": "Ubah Biaya Bersama",
    "sharedCost.empty": "Belum ada biaya bersama.",
    "sharedCost.field.name": "Nama",
    "sharedCost.field.name.required": "Nama wajib diisi.",
    "sharedCost.field.amount": "Jumlah (IDR)",
    "sharedCost.field.amount.required": "Jumlah wajib diisi.",
    "sharedCost.delete.confirm": "Hapus biaya ini?",
    "item.title": "Item",
    "item.add": "Tambah Item",
    "item.edit.title": "Ubah Item",
    "item.empty": "Belum ada item.",
    "item.field.name": "Nama Menu",
    "item.field.name.required": "Nama menu wajib diisi.",
    "item.field.price": "Harga (IDR)",
    "item.field.price.required": "Harga wajib diisi.",
    "item.field.assignTo": "Assign ke",
    "item.field.assignTo.required": "Pilih minimal 1 orang.",
    "item.splitNote.prefix": "Harga dibagi rata ke",
    "item.splitNote.suffix": "orang",
    "item.delete.confirm": "Hapus item ini?",
    "item.equalModeOnly": "Item hanya tersedia di mode item-based.",
```

In the `en` dictionary, append after `"restaurant.tax.included"` (before the closing `},`):

```ts
    "session.hub.sharedCosts": "Shared Costs",
    "sharedCost.title": "Shared Costs",
    "sharedCost.add": "Add Shared Cost",
    "sharedCost.edit.title": "Edit Shared Cost",
    "sharedCost.empty": "No shared costs yet.",
    "sharedCost.field.name": "Name",
    "sharedCost.field.name.required": "Name is required.",
    "sharedCost.field.amount": "Amount (IDR)",
    "sharedCost.field.amount.required": "Amount is required.",
    "sharedCost.delete.confirm": "Delete this cost?",
    "item.title": "Items",
    "item.add": "Add Item",
    "item.edit.title": "Edit Item",
    "item.empty": "No items yet.",
    "item.field.name": "Menu Item",
    "item.field.name.required": "Menu item name is required.",
    "item.field.price": "Price (IDR)",
    "item.field.price.required": "Price is required.",
    "item.field.assignTo": "Assign to",
    "item.field.assignTo.required": "Select at least 1 person.",
    "item.splitNote.prefix": "Price split evenly across",
    "item.splitNote.suffix": "people",
    "item.delete.confirm": "Delete this item?",
    "item.equalModeOnly": "Items are only available in item-based mode.",
```

- [ ] **Step 3: Run parity test — expect PASS**

```
npx vitest run lib/i18n/__tests__/dictionaries.test.ts
```

- [ ] **Step 4: Type check**

```
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```
git add lib/i18n/dictionaries.ts
git commit -m "feat: add i18n keys for items and shared costs"
```

---

## Task 3: Item Repository

**Files:**
- Create: `lib/data/item-repo/types.ts`
- Create: `lib/data/item-repo/mock-repo.ts`
- Create: `lib/data/item-repo/index.ts`
- Create: `lib/data/item-repo/__tests__/mock-repo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/data/item-repo/__tests__/mock-repo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockItemRepo } from "@/lib/data/item-repo/mock-repo";

describe("mockItemRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates an item with all fields", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1",
      restaurantId: "r1",
      name: "Ayam Goreng",
      price: 25000,
      assignedTo: ["m1"],
    });
    expect(item.itemId).toBeTruthy();
    expect(item.sessionId).toBe("s1");
    expect(item.restaurantId).toBe("r1");
    expect(item.name).toBe("Ayam Goreng");
    expect(item.price).toBe(25000);
    expect(item.assignedTo).toEqual(["m1"]);
  });

  it("lists items scoped to sessionId+restaurantId", async () => {
    await mockItemRepo.create({ sessionId: "s1", restaurantId: "r1", name: "A", price: 10000, assignedTo: ["m1"] });
    await mockItemRepo.create({ sessionId: "s1", restaurantId: "r2", name: "B", price: 20000, assignedTo: ["m1"] });
    await mockItemRepo.create({ sessionId: "s2", restaurantId: "r1", name: "C", price: 30000, assignedTo: ["m1"] });
    const list = await mockItemRepo.list("s1", "r1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("A");
  });

  it("updates only specified fields", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1", restaurantId: "r1", name: "X", price: 10000, assignedTo: ["m1"],
    });
    await mockItemRepo.update("s1", "r1", item.itemId, { name: "Y", price: 20000 });
    const updated = await mockItemRepo.get("s1", "r1", item.itemId);
    expect(updated?.name).toBe("Y");
    expect(updated?.price).toBe(20000);
    expect(updated?.assignedTo).toEqual(["m1"]);
  });

  it("deletes an item", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1", restaurantId: "r1", name: "Gone", price: 5000, assignedTo: ["m1"],
    });
    await mockItemRepo.delete("s1", "r1", item.itemId);
    expect(await mockItemRepo.get("s1", "r1", item.itemId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockItemRepo.get("s1", "r1", "nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

```
npx vitest run lib/data/item-repo/__tests__/mock-repo.test.ts
```

- [ ] **Step 3: Create interface**

Create `lib/data/item-repo/types.ts`:

```ts
import type { Item, NewItemInput, ItemPatch } from "@/lib/types";

export interface ItemRepository {
  list(sessionId: string, restaurantId: string): Promise<Item[]>;
  get(sessionId: string, restaurantId: string, itemId: string): Promise<Item | null>;
  create(input: NewItemInput): Promise<Item>;
  update(sessionId: string, restaurantId: string, itemId: string, patch: ItemPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string, itemId: string): Promise<void>;
}
```

- [ ] **Step 4: Create mock repo**

Create `lib/data/item-repo/mock-repo.ts`:

```ts
import type { Item, NewItemInput, ItemPatch } from "@/lib/types";
import type { ItemRepository } from "./types";

function storageKey(sessionId: string, restaurantId: string): string {
  return `splitbro:items:${sessionId}:${restaurantId}`;
}

function readAll(sessionId: string, restaurantId: string): Item[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId, restaurantId));
  return raw ? (JSON.parse(raw) as Item[]) : [];
}

function writeAll(sessionId: string, restaurantId: string, items: Item[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId, restaurantId), JSON.stringify(items));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockItemRepo: ItemRepository = {
  async list(sessionId, restaurantId) {
    return readAll(sessionId, restaurantId);
  },

  async get(sessionId, restaurantId, itemId) {
    return readAll(sessionId, restaurantId).find((i) => i.itemId === itemId) ?? null;
  },

  async create(input: NewItemInput) {
    const all = readAll(input.sessionId, input.restaurantId);
    const item: Item = {
      itemId: uid(),
      sessionId: input.sessionId,
      restaurantId: input.restaurantId,
      name: input.name,
      price: input.price,
      assignedTo: input.assignedTo,
    };
    writeAll(input.sessionId, input.restaurantId, [...all, item]);
    return item;
  },

  async update(sessionId, restaurantId, itemId, patch: ItemPatch) {
    const all = readAll(sessionId, restaurantId);
    const idx = all.findIndex((i) => i.itemId === itemId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, restaurantId, all);
  },

  async delete(sessionId, restaurantId, itemId) {
    writeAll(
      sessionId,
      restaurantId,
      readAll(sessionId, restaurantId).filter((i) => i.itemId !== itemId)
    );
  },
};
```

- [ ] **Step 5: Create factory**

Create `lib/data/item-repo/index.ts`:

```ts
import type { ItemRepository } from "./types";
import { mockItemRepo } from "./mock-repo";

export function getItemRepo(): ItemRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase item backend not yet implemented");
  }
  return mockItemRepo;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```
npx vitest run lib/data/item-repo/__tests__/mock-repo.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 7: Type check + full suite**

```
npx tsc --noEmit && npx vitest run
```

- [ ] **Step 8: Commit**

```
git add lib/data/item-repo/
git commit -m "feat: add ItemRepository interface, mock, and factory"
```

---

## Task 4: SharedCost Repository

**Files:**
- Create: `lib/data/shared-cost-repo/types.ts`
- Create: `lib/data/shared-cost-repo/mock-repo.ts`
- Create: `lib/data/shared-cost-repo/index.ts`
- Create: `lib/data/shared-cost-repo/__tests__/mock-repo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/data/shared-cost-repo/__tests__/mock-repo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockSharedCostRepo } from "@/lib/data/shared-cost-repo/mock-repo";

describe("mockSharedCostRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a shared cost", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "Driver", amount: 50000 });
    expect(sc.costId).toBeTruthy();
    expect(sc.sessionId).toBe("s1");
    expect(sc.name).toBe("Driver");
    expect(sc.amount).toBe(50000);
  });

  it("lists costs scoped to sessionId", async () => {
    await mockSharedCostRepo.create({ sessionId: "s1", name: "A", amount: 10000 });
    await mockSharedCostRepo.create({ sessionId: "s2", name: "B", amount: 20000 });
    const list = await mockSharedCostRepo.list("s1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("A");
  });

  it("updates only specified fields", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "X", amount: 10000 });
    await mockSharedCostRepo.update("s1", sc.costId, { amount: 20000 });
    const updated = await mockSharedCostRepo.get("s1", sc.costId);
    expect(updated?.amount).toBe(20000);
    expect(updated?.name).toBe("X");
  });

  it("deletes a shared cost", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "Gone", amount: 5000 });
    await mockSharedCostRepo.delete("s1", sc.costId);
    expect(await mockSharedCostRepo.get("s1", sc.costId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockSharedCostRepo.get("s1", "nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

```
npx vitest run lib/data/shared-cost-repo/__tests__/mock-repo.test.ts
```

- [ ] **Step 3: Create interface**

Create `lib/data/shared-cost-repo/types.ts`:

```ts
import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";

export interface SharedCostRepository {
  list(sessionId: string): Promise<SharedCost[]>;
  get(sessionId: string, costId: string): Promise<SharedCost | null>;
  create(input: NewSharedCostInput): Promise<SharedCost>;
  update(sessionId: string, costId: string, patch: SharedCostPatch): Promise<void>;
  delete(sessionId: string, costId: string): Promise<void>;
}
```

- [ ] **Step 4: Create mock repo**

Create `lib/data/shared-cost-repo/mock-repo.ts`:

```ts
import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";
import type { SharedCostRepository } from "./types";

function storageKey(sessionId: string): string {
  return `splitbro:sharedcosts:${sessionId}`;
}

function readAll(sessionId: string): SharedCost[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId));
  return raw ? (JSON.parse(raw) as SharedCost[]) : [];
}

function writeAll(sessionId: string, costs: SharedCost[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId), JSON.stringify(costs));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockSharedCostRepo: SharedCostRepository = {
  async list(sessionId) {
    return readAll(sessionId);
  },

  async get(sessionId, costId) {
    return readAll(sessionId).find((c) => c.costId === costId) ?? null;
  },

  async create(input: NewSharedCostInput) {
    const all = readAll(input.sessionId);
    const cost: SharedCost = {
      costId: uid(),
      sessionId: input.sessionId,
      name: input.name,
      amount: input.amount,
    };
    writeAll(input.sessionId, [...all, cost]);
    return cost;
  },

  async update(sessionId, costId, patch: SharedCostPatch) {
    const all = readAll(sessionId);
    const idx = all.findIndex((c) => c.costId === costId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, all);
  },

  async delete(sessionId, costId) {
    writeAll(sessionId, readAll(sessionId).filter((c) => c.costId !== costId));
  },
};
```

- [ ] **Step 5: Create factory**

Create `lib/data/shared-cost-repo/index.ts`:

```ts
import type { SharedCostRepository } from "./types";
import { mockSharedCostRepo } from "./mock-repo";

export function getSharedCostRepo(): SharedCostRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase shared-cost backend not yet implemented");
  }
  return mockSharedCostRepo;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```
npx vitest run lib/data/shared-cost-repo/__tests__/mock-repo.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 7: Type check + full suite**

```
npx tsc --noEmit && npx vitest run
```

- [ ] **Step 8: Commit**

```
git add lib/data/shared-cost-repo/
git commit -m "feat: add SharedCostRepository interface, mock, and factory"
```

---

## Task 5: useItems + useSharedCosts Hooks

**Files:**
- Create: `lib/data/use-items.ts`
- Create: `lib/data/use-shared-costs.ts`

Tested via type check only (hooks require a React environment).

- [ ] **Step 1: Create `lib/data/use-items.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Item, NewItemInput, ItemPatch } from "@/lib/types";
import { getItemRepo } from "./item-repo/index";

export function useItems(sessionId: string, restaurantId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getItemRepo();
    setLoading(true);
    setItems(await repo.list(sessionId, restaurantId));
    setLoading(false);
  }, [sessionId, restaurantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewItemInput, "sessionId" | "restaurantId">) => {
      const repo = getItemRepo();
      const item = await repo.create({ ...input, sessionId, restaurantId });
      await refresh();
      return item;
    },
    [sessionId, restaurantId, refresh]
  );

  const update = useCallback(
    async (itemId: string, patch: ItemPatch) => {
      const repo = getItemRepo();
      await repo.update(sessionId, restaurantId, itemId, patch);
      await refresh();
    },
    [sessionId, restaurantId, refresh]
  );

  const remove = useCallback(
    async (itemId: string) => {
      const repo = getItemRepo();
      await repo.delete(sessionId, restaurantId, itemId);
      await refresh();
    },
    [sessionId, restaurantId, refresh]
  );

  return { items, loading, add, update, remove, refresh };
}
```

- [ ] **Step 2: Create `lib/data/use-shared-costs.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";
import { getSharedCostRepo } from "./shared-cost-repo/index";

export function useSharedCosts(sessionId: string) {
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getSharedCostRepo();
    setLoading(true);
    setSharedCosts(await repo.list(sessionId));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewSharedCostInput, "sessionId">) => {
      const repo = getSharedCostRepo();
      const sc = await repo.create({ ...input, sessionId });
      await refresh();
      return sc;
    },
    [sessionId, refresh]
  );

  const update = useCallback(
    async (costId: string, patch: SharedCostPatch) => {
      const repo = getSharedCostRepo();
      await repo.update(sessionId, costId, patch);
      await refresh();
    },
    [sessionId, refresh]
  );

  const remove = useCallback(
    async (costId: string) => {
      const repo = getSharedCostRepo();
      await repo.delete(sessionId, costId);
      await refresh();
    },
    [sessionId, refresh]
  );

  return { sharedCosts, loading, add, update, remove, refresh };
}
```

- [ ] **Step 3: Type check**

```
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```
git add lib/data/use-items.ts lib/data/use-shared-costs.ts
git commit -m "feat: add useItems and useSharedCosts hooks"
```

---

## Task 6: Calculation Engine

**Files:**
- Create: `lib/calc/settlement.ts`
- Create: `lib/calc/__tests__/settlement.test.ts`

This is the heart of the app. Implement the algorithm verbatim from `.claude/rules/calculation-engine.md`. No rounding inside this function.

- [ ] **Step 1: Write failing tests**

Create `lib/calc/__tests__/settlement.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeSettlement } from "@/lib/calc/settlement";
import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";

function makeSession(mode: "equal" | "item_based", members: { memberId: string; name: string; deposit?: number }[]): Session {
  return {
    id: "s1",
    name: "Test Trip",
    adminId: "admin1",
    mode,
    currency: "IDR",
    defaultTaxRate: 11,
    status: "active",
    shareToken: "tok",
    paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
    members: members.map((m) => ({ ...m, email: null, phone: null, deposit: m.deposit ?? 0 })),
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    restaurantId: "r1",
    sessionId: "s1",
    name: "Resto",
    date: null,
    order: 0,
    taxIncluded: false,
    taxRate: 11,
    totalAmount: null,
    ...overrides,
  };
}

describe("computeSettlement — equal mode", () => {
  it("splits total evenly, tax excluded", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: false, taxRate: 11, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // effectiveTotal = 100000 * 1.11 = 111000; per member = 55500
    expect(breakdown[0].consumption).toBe(55500);
    expect(breakdown[1].consumption).toBe(55500);
  });

  it("splits total evenly, tax included (multiplier = 1)", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 111000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // effectiveTotal = 111000 (no change); per member = 55500
    expect(breakdown[0].consumption).toBe(55500);
    expect(breakdown[1].consumption).toBe(55500);
  });

  it("grandTotal equals sum of all totalTagihan", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 200000 });
    const { breakdown, grandTotal } = computeSettlement(session, [restaurant], {}, []);
    const summed = breakdown.reduce((a, b) => a + b.totalTagihan, 0);
    expect(grandTotal).toBeCloseTo(summed, 5);
  });
});

describe("computeSettlement — item_based mode", () => {
  it("single-assign: full price goes to that member", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "A", price: 30000, assignedTo: ["m1"] },
      { itemId: "i2", sessionId: "s1", restaurantId: "r1", name: "B", price: 20000, assignedTo: ["m2"] },
    ];
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(20000);
  });

  it("multi-assign: price split evenly among assigned members", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
      { memberId: "m3", name: "Carol" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "Shared", price: 60000, assignedTo: ["m1", "m2"] },
    ];
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m3")?.consumption).toBe(0);
  });

  it("proportional tax: heavier orderer carries more PPN", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: false, taxRate: 10 });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "A", price: 100000, assignedTo: ["m1"] },
      { itemId: "i2", sessionId: "s1", restaurantId: "r1", name: "B", price: 50000, assignedTo: ["m2"] },
    ];
    // subtotal = 150000; effectiveTotal = 165000; taxMultiplier = 1.1
    // m1 raw = 100000 → 110000; m2 raw = 50000 → 55000
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBeCloseTo(110000, 5);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBeCloseTo(55000, 5);
  });
});

describe("computeSettlement — shared costs", () => {
  it("divides shared cost evenly across all members", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const sharedCosts: SharedCost[] = [
      { costId: "c1", sessionId: "s1", name: "Driver", amount: 20000 },
    ];
    const { breakdown } = computeSettlement(session, [], {}, sharedCosts);
    expect(breakdown[0].sharedShare).toBe(10000);
    expect(breakdown[1].sharedShare).toBe(10000);
  });
});

describe("computeSettlement — deposit / settlement", () => {
  it("netDue > 0 when member underpays", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 50000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // totalTagihan = 100000; deposit = 50000; netDue = 50000
    expect(breakdown[0].netDue).toBe(50000);
  });

  it("netDue < 0 when member overpays", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 120000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].netDue).toBe(-20000);
  });

  it("netDue = 0 when member pays exactly", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 100000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].netDue).toBe(0);
  });

  it("totalDeposit equals sum of all deposits", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice", deposit: 50000 },
      { memberId: "m2", name: "Bob", deposit: 75000 },
    ]);
    const { totalDeposit } = computeSettlement(session, [], {}, []);
    expect(totalDeposit).toBe(125000);
  });
});

describe("computeSettlement — edge cases", () => {
  it("returns empty breakdown for session with no members", () => {
    const session = makeSession("equal", []);
    const { breakdown, grandTotal, totalDeposit } = computeSettlement(session, [], {}, []);
    expect(breakdown).toHaveLength(0);
    expect(grandTotal).toBe(0);
    expect(totalDeposit).toBe(0);
  });

  it("skips restaurant with null totalAmount in equal mode", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice" }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: null });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].consumption).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

```
npx vitest run lib/calc/__tests__/settlement.test.ts
```

Expected: FAIL — `computeSettlement` not found.

- [ ] **Step 3: Implement `lib/calc/settlement.ts`**

```ts
import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";

export type Breakdown = {
  memberId: string;
  name: string;
  consumption: number;
  sharedShare: number;
  totalTagihan: number;
  deposit: number;
  netDue: number;
};

function applyTax(
  baseAmount: number,
  r: { taxIncluded: boolean; taxRate: number }
): number {
  if (r.taxIncluded) return baseAmount;
  return baseAmount * (1 + r.taxRate / 100);
}

export function computeSettlement(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[]
): { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number } {
  const N = session.members.length;
  if (N === 0) return { breakdown: [], grandTotal: 0, totalDeposit: 0 };

  const consumption: Record<string, number> = {};
  const sharedShare: Record<string, number> = {};
  for (const m of session.members) {
    consumption[m.memberId] = 0;
    sharedShare[m.memberId] = 0;
  }

  if (session.mode === "equal") {
    for (const r of restaurants) {
      if (r.totalAmount == null) continue;
      const effectiveTotal = applyTax(r.totalAmount, r);
      const sharePerMember = effectiveTotal / N;
      for (const m of session.members) {
        consumption[m.memberId] += sharePerMember;
      }
    }
  } else {
    for (const r of restaurants) {
      const items = itemsByResto[r.restaurantId] ?? [];
      const rawShare: Record<string, number> = {};
      let subtotal = 0;
      for (const item of items) {
        const k = item.assignedTo.length;
        if (k === 0) continue;
        const pricePerHead = item.price / k;
        for (const memberId of item.assignedTo) {
          rawShare[memberId] = (rawShare[memberId] ?? 0) + pricePerHead;
        }
        subtotal += item.price;
      }
      if (subtotal > 0) {
        const effectiveTotal = applyTax(subtotal, r);
        const taxMultiplier = effectiveTotal / subtotal;
        for (const [memberId, raw] of Object.entries(rawShare)) {
          consumption[memberId] = (consumption[memberId] ?? 0) + raw * taxMultiplier;
        }
      }
    }
  }

  for (const sc of sharedCosts) {
    const perMember = sc.amount / N;
    for (const m of session.members) {
      sharedShare[m.memberId] += perMember;
    }
  }

  const breakdown: Breakdown[] = session.members.map((m) => {
    const c = consumption[m.memberId] ?? 0;
    const s = sharedShare[m.memberId] ?? 0;
    const totalTagihan = c + s;
    return {
      memberId: m.memberId,
      name: m.name,
      consumption: c,
      sharedShare: s,
      totalTagihan,
      deposit: m.deposit,
      netDue: totalTagihan - m.deposit,
    };
  });

  const grandTotal = breakdown.reduce((acc, b) => acc + b.totalTagihan, 0);
  const totalDeposit = breakdown.reduce((acc, b) => acc + b.deposit, 0);

  return { breakdown, grandTotal, totalDeposit };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run lib/calc/__tests__/settlement.test.ts
```

Expected: all 11 tests PASS.

- [ ] **Step 5: Type check + full suite**

```
npx tsc --noEmit && npx vitest run
```

- [ ] **Step 6: Commit**

```
git add lib/calc/
git commit -m "feat: add computeSettlement pure function with unit tests"
```

---

## Task 7: Navigation Changes

**Files:**
- Modify: `app/(app)/sessions/[id]/page.tsx`
- Modify: `components/restaurants/RestaurantList.tsx`

- [ ] **Step 1: Update `app/(app)/sessions/[id]/page.tsx`**

Add `useSharedCosts` import and 4th hub card. The full updated file:

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { getSessionRepo } from "@/lib/data/index";
import { SessionForm } from "@/components/sessions/SessionForm";
import { DeleteConfirm } from "@/components/sessions/DeleteConfirm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function HubInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { session, loading, update } = useSession(id, user?.uid ?? null);
  const { restaurants } = useRestaurants(id);
  const { sharedCosts } = useSharedCosts(id);
  const [confirming, setConfirming] = useState(false);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/sessions" className="mb-4 inline-block text-sm text-blue-600">
        ← {t("common.back")}
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-bold">{session.name}</h1>
        <Badge tone={session.status === "active" ? "green" : "gray"}>
          {t(session.status === "active" ? "session.status.active" : "session.status.closed")}
        </Badge>
      </div>

      <SessionForm
        mode="edit"
        initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
        onSubmit={async (values) => {
          await update({ name: values.name, defaultTaxRate: values.defaultTaxRate });
        }}
      />

      <div className="mt-6 flex flex-col gap-3">
        <Link href={`/sessions/${id}/members`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.members")}</span>
            <span className="text-gray-500">{session.members.length} →</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/payment`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.payment")}</span>
            <span className="text-gray-500">→</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/restaurants`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.restaurants")}</span>
            <span className="text-gray-500">{restaurants.length} →</span>
          </Card>
        </Link>
        <Link href={`/sessions/${id}/shared-costs`}>
          <Card className="flex cursor-pointer items-center justify-between hover:bg-gray-50">
            <span className="font-medium">{t("session.hub.sharedCosts")}</span>
            <span className="text-gray-500">{sharedCosts.length} →</span>
          </Card>
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => update({ status: session.status === "active" ? "closed" : "active" })}
        >
          {session.status === "active" ? t("session.status.close") : t("session.status.reopen")}
        </Button>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          {t("common.delete")}
        </Button>
      </div>

      {confirming && (
        <DeleteConfirm
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            await getSessionRepo().delete(id);
            router.push("/sessions");
          }}
        />
      )}
    </main>
  );
}

export default function SessionHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <HubInner id={id} />
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Update `components/restaurants/RestaurantList.tsx`**

Add `sessionId` prop and item navigation link in item_based mode. Full updated file:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { RestaurantForm, type RestaurantFormValues } from "./RestaurantForm";

export function RestaurantList({
  restaurants,
  sessionId,
  sessionMode,
  defaultTaxRate,
  onUpdate,
  onRemove,
}: {
  restaurants: Restaurant[];
  sessionId: string;
  sessionMode: SessionMode;
  defaultTaxRate: number;
  onUpdate: (restaurantId: string, values: RestaurantFormValues) => void;
  onRemove: (restaurantId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (restaurants.length === 0) {
    return <p className="text-sm text-gray-500">{t("restaurant.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {restaurants.map((r) => (
        <Card key={r.restaurantId}>
          {editingId === r.restaurantId ? (
            <RestaurantForm
              initial={{
                name: r.name,
                date: r.date,
                taxIncluded: r.taxIncluded,
                taxRate: r.taxRate,
                totalAmount: r.totalAmount,
              }}
              sessionMode={sessionMode}
              defaultTaxRate={defaultTaxRate}
              onSubmit={(values) => {
                onUpdate(r.restaurantId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === r.restaurantId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("restaurant.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(r.restaurantId);
                    setConfirmingId(null);
                  }}
                >
                  {t("common.delete")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.date && <p className="text-sm text-gray-500">{r.date}</p>}
                <p className="text-sm text-gray-500">
                  {r.taxIncluded ? t("restaurant.tax.included") : `PPN ${r.taxRate}%`}
                </p>
                {r.totalAmount != null && (
                  <p className="text-sm">{formatIDR(r.totalAmount)}</p>
                )}
              </div>
              <div className="flex gap-1">
                {sessionMode === "item_based" && (
                  <Link
                    href={`/sessions/${sessionId}/restaurants/${r.restaurantId}`}
                    className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                  >
                    {t("item.title")}
                  </Link>
                )}
                <Button variant="secondary" onClick={() => setEditingId(r.restaurantId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(r.restaurantId)}>
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update restaurants page to pass `sessionId` prop**

In `app/(app)/sessions/[id]/restaurants/page.tsx`, the `RestaurantList` call needs the new `sessionId` prop. The current call:

```tsx
<RestaurantList
  restaurants={restaurants}
  sessionMode={session.mode}
  defaultTaxRate={session.defaultTaxRate}
  onUpdate={...}
  onRemove={...}
/>
```

Change to:

```tsx
<RestaurantList
  restaurants={restaurants}
  sessionId={id}
  sessionMode={session.mode}
  defaultTaxRate={session.defaultTaxRate}
  onUpdate={async (restaurantId, values) => {
    await update(restaurantId, values);
  }}
  onRemove={async (restaurantId) => {
    await remove(restaurantId);
  }}
/>
```

- [ ] **Step 4: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Full test suite**

```
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```
git add "app/(app)/sessions/[id]/page.tsx" components/restaurants/RestaurantList.tsx "app/(app)/sessions/[id]/restaurants/page.tsx"
git commit -m "feat: add shared-costs hub card and item navigation links to RestaurantList"
```

---

## Task 8: Shared Costs CRUD UI

**Files:**
- Create: `components/shared-costs/SharedCostForm.tsx`
- Create: `components/shared-costs/SharedCostList.tsx`
- Create: `app/(app)/sessions/[id]/shared-costs/page.tsx`

- [ ] **Step 1: Create `components/shared-costs/SharedCostForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface SharedCostFormValues {
  name: string;
  amount: number;
}

export function SharedCostForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<SharedCostFormValues>;
  onSubmit: (values: SharedCostFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [nameError, setNameError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setNameError(t("sharedCost.field.name.required"));
      valid = false;
    } else {
      setNameError(null);
    }
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      setAmountError(t("sharedCost.field.amount.required"));
      valid = false;
    } else {
      setAmountError(null);
    }
    if (!valid) return;
    onSubmit({ name: name.trim(), amount: parsed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("sharedCost.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {nameError && <p className="text-sm text-red-600">{nameError}</p>}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("sharedCost.field.amount")}</span>
        <Input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {amountError && <p className="text-sm text-red-600">{amountError}</p>}
      <div className="flex gap-2">
        <Button type="submit">{t("common.save")}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `components/shared-costs/SharedCostList.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { SharedCost } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { SharedCostForm, type SharedCostFormValues } from "./SharedCostForm";

export function SharedCostList({
  sharedCosts,
  onUpdate,
  onRemove,
}: {
  sharedCosts: SharedCost[];
  onUpdate: (costId: string, values: SharedCostFormValues) => void;
  onRemove: (costId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (sharedCosts.length === 0) {
    return <p className="text-sm text-gray-500">{t("sharedCost.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sharedCosts.map((sc) => (
        <Card key={sc.costId}>
          {editingId === sc.costId ? (
            <SharedCostForm
              initial={{ name: sc.name, amount: sc.amount }}
              onSubmit={(values) => {
                onUpdate(sc.costId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === sc.costId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("sharedCost.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(sc.costId);
                    setConfirmingId(null);
                  }}
                >
                  {t("common.delete")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{sc.name}</p>
                <p className="text-sm text-gray-500">{formatIDR(sc.amount)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(sc.costId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(sc.costId)}>
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(app)/sessions/[id]/shared-costs/page.tsx`**

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { SharedCostForm } from "@/components/shared-costs/SharedCostForm";
import { SharedCostList } from "@/components/shared-costs/SharedCostList";
import { Button } from "@/components/ui/Button";

function SharedCostsInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { sharedCosts, loading: costsLoading, add, update, remove } = useSharedCosts(id);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || costsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("sharedCost.title")}</h1>

      <SharedCostList
        sharedCosts={sharedCosts}
        onUpdate={async (costId, values) => {
          await update(costId, values);
        }}
        onRemove={async (costId) => {
          await remove(costId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <SharedCostForm
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("sharedCost.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function SharedCostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <SharedCostsInner id={id} />
    </AuthGuard>
  );
}
```

- [ ] **Step 4: Type check**

```
npx tsc --noEmit
```

- [ ] **Step 5: Full test suite**

```
npx vitest run
```

- [ ] **Step 6: Commit**

```
git add components/shared-costs/ "app/(app)/sessions/[id]/shared-costs/"
git commit -m "feat: add Shared Costs CRUD (SharedCostForm, SharedCostList, shared-costs sub-route)"
```

---

## Task 9: Items CRUD UI

**Files:**
- Create: `components/items/ItemForm.tsx`
- Create: `components/items/ItemList.tsx`
- Create: `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx`

- [ ] **Step 1: Create `components/items/ItemForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface ItemFormValues {
  name: string;
  price: number;
  assignedTo: string[];
}

export function ItemForm({
  initial,
  members,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ItemFormValues>;
  members: Member[];
  onSubmit: (values: ItemFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [assignedTo, setAssignedTo] = useState<string[]>(initial?.assignedTo ?? []);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  function toggleMember(memberId: string) {
    setAssignedTo((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setNameError(t("item.field.name.required"));
      valid = false;
    } else {
      setNameError(null);
    }
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setPriceError(t("item.field.price.required"));
      valid = false;
    } else {
      setPriceError(null);
    }
    if (assignedTo.length === 0) {
      setAssignError(t("item.field.assignTo.required"));
      valid = false;
    } else {
      setAssignError(null);
    }
    if (!valid) return;
    onSubmit({ name: name.trim(), price: parsedPrice, assignedTo });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("item.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {nameError && <p className="text-sm text-red-600">{nameError}</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("item.field.price")}</span>
        <Input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      {priceError && <p className="text-sm text-red-600">{priceError}</p>}

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t("item.field.assignTo")}</legend>
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <label key={m.memberId} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignedTo.includes(m.memberId)}
                onChange={() => toggleMember(m.memberId)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">{m.name}</span>
            </label>
          ))}
        </div>
        {assignedTo.length > 1 && (
          <p className="mt-1 text-xs text-gray-500">
            {t("item.splitNote.prefix")} {assignedTo.length} {t("item.splitNote.suffix")}
          </p>
        )}
      </fieldset>
      {assignError && <p className="text-sm text-red-600">{assignError}</p>}

      <div className="flex gap-2">
        <Button type="submit">{t("common.save")}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `components/items/ItemList.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Item, Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { ItemForm, type ItemFormValues } from "./ItemForm";

export function ItemList({
  items,
  members,
  onUpdate,
  onRemove,
}: {
  items: Item[];
  members: Member[];
  onUpdate: (itemId: string, values: ItemFormValues) => void;
  onRemove: (itemId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{t("item.empty")}</p>;
  }

  function memberNames(assignedTo: string[]): string {
    return assignedTo
      .map((id) => members.find((m) => m.memberId === id)?.name ?? id)
      .join(", ");
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.itemId}>
          {editingId === item.itemId ? (
            <ItemForm
              initial={{ name: item.name, price: item.price, assignedTo: item.assignedTo }}
              members={members}
              onSubmit={(values) => {
                onUpdate(item.itemId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === item.itemId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("item.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(item.itemId);
                    setConfirmingId(null);
                  }}
                >
                  {t("common.delete")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm">{formatIDR(item.price)}</p>
                <p className="text-sm text-gray-500">{memberNames(item.assignedTo)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(item.itemId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(item.itemId)}>
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(app)/sessions/[id]/restaurants/[restaurantId]/page.tsx`**

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useItems } from "@/lib/data/use-items";
import { ItemForm } from "@/components/items/ItemForm";
import { ItemList } from "@/components/items/ItemList";
import { Button } from "@/components/ui/Button";

function ItemsInner({ id, restaurantId }: { id: string; restaurantId: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { items, loading: itemsLoading, add, update, remove } = useItems(id, restaurantId);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || itemsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  if (session.mode === "equal") {
    return (
      <main className="mx-auto max-w-md p-4">
        <Link href={`/sessions/${id}/restaurants`} className="mb-4 inline-block text-sm text-blue-600">
          ← {t("restaurant.title")}
        </Link>
        <p className="text-gray-500">{t("item.equalModeOnly")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}/restaurants`} className="mb-4 inline-block text-sm text-blue-600">
        ← {t("restaurant.title")}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("item.title")}</h1>

      <ItemList
        items={items}
        members={session.members}
        onUpdate={async (itemId, values) => {
          await update(itemId, values);
        }}
        onRemove={async (itemId) => {
          await remove(itemId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <ItemForm
            members={session.members}
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("item.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function ItemsPage({
  params,
}: {
  params: Promise<{ id: string; restaurantId: string }>;
}) {
  const { id, restaurantId } = use(params);
  return (
    <AuthGuard>
      <ItemsInner id={id} restaurantId={restaurantId} />
    </AuthGuard>
  );
}
```

- [ ] **Step 4: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Full test suite**

```
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```
git add components/items/ "app/(app)/sessions/[id]/restaurants/[restaurantId]/"
git commit -m "feat: add Items CRUD (ItemForm, ItemList, items sub-route per restaurant)"
```

---

## Final Verification

- [ ] **Full test suite**

```
npx vitest run
```

Expected: all tests PASS (46 from 1A+1B + 11 settlement + 5 item-repo + 5 shared-cost-repo + 4 new types = ~71).

- [ ] **Type check**

```
npx tsc --noEmit
```

- [ ] **Build**

```
npm run build
```

Expected: build succeeds; routes visible:
```
/sessions/[id]/shared-costs     ƒ
/sessions/[id]/restaurants/[restaurantId]  ƒ
```
