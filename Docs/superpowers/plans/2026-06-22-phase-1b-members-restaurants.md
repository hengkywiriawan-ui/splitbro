# Phase 1B — Members, Payment Info & Restaurants: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can manage members, payment info, and restaurants (with per-restaurant tax settings) within a session, via a hub-and-sub-routes UI.

**Architecture:** New `RestaurantRepository` seam mirrors the existing `SessionRepository` pattern (interface + localStorage mock + factory). Members stay embedded in the session doc and are mutated via pure helpers in `lib/members.ts`. The `/[id]` page is refactored from a standalone edit form to a hub with three navigation cards linking to `/[id]/members`, `/[id]/payment`, and `/[id]/restaurants`.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind · Vitest · localStorage mock

---

## File Map

**Create:**
- `lib/members.ts` — pure add/update/remove helpers for the embedded members array
- `lib/__tests__/members.test.ts` — unit tests for the above
- `lib/data/restaurant-repo/types.ts` — `RestaurantRepository` interface
- `lib/data/restaurant-repo/mock-repo.ts` — localStorage mock
- `lib/data/restaurant-repo/index.ts` — `getRestaurantRepo()` factory
- `lib/data/restaurant-repo/__tests__/mock-repo.test.ts` — CRUD tests
- `lib/data/use-restaurants.ts` — `useRestaurants(sessionId)` hook
- `lib/data/use-session.ts` — `useSession(id, adminId)` single-session hook
- `components/members/MemberForm.tsx`
- `components/members/MemberList.tsx`
- `components/payment/PaymentInfoForm.tsx`
- `components/restaurants/RestaurantForm.tsx`
- `components/restaurants/RestaurantList.tsx`
- `app/(app)/sessions/[id]/members/page.tsx`
- `app/(app)/sessions/[id]/payment/page.tsx`
- `app/(app)/sessions/[id]/restaurants/page.tsx`

**Modify:**
- `lib/types.ts` — add `Restaurant`, `NewRestaurantInput`, `RestaurantPatch`
- `lib/__tests__/types.test.ts` — add Restaurant shape test
- `lib/i18n/dictionaries.ts` — add ~31 new keys (member/payment/restaurant/hub groups)
- `app/(app)/sessions/[id]/page.tsx` — refactor from edit form to hub

---

## Task 1: Restaurant + Member Types

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Write a failing type-shape test**

Append to `lib/__tests__/types.test.ts` after the existing tests:

```ts
import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";

it("constructs a Restaurant with all required fields", () => {
  const r: Restaurant = {
    restaurantId: "r1",
    sessionId: "s1",
    name: "Depot Bu Sri",
    date: "2025-06-01",
    order: 0,
    taxIncluded: false,
    taxRate: 11,
    totalAmount: 450000,
  };
  expect(r.restaurantId).toBe("r1");
  expect(r.totalAmount).toBe(450000);
});

it("RestaurantPatch omits restaurantId and sessionId", () => {
  const patch: RestaurantPatch = { name: "New Name", totalAmount: null };
  expect(patch.name).toBe("New Name");
});
```

- [ ] **Step 2: Run tests — expect TypeScript import errors**

```
npx vitest run lib/__tests__/types.test.ts
```

Expected: FAIL — `Restaurant` not found in `@/lib/types`.

- [ ] **Step 3: Add new types to `lib/types.ts`**

Append after the `EMPTY_PAYMENT_INFO` export at the end of `lib/types.ts`:

```ts
export interface Restaurant {
  restaurantId: string;
  sessionId: string;
  name: string;
  date: string | null;
  order: number;
  taxIncluded: boolean;
  taxRate: number;
  totalAmount: number | null;
}

export interface NewRestaurantInput {
  sessionId: string;
  name: string;
  date?: string | null;
  order?: number;
  taxIncluded?: boolean;
  taxRate?: number;
  totalAmount?: number | null;
}

export type RestaurantPatch = Partial<Omit<Restaurant, "restaurantId" | "sessionId">>;
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run lib/__tests__/types.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```
git add lib/types.ts lib/__tests__/types.test.ts
git commit -m "feat: add Restaurant, NewRestaurantInput, RestaurantPatch types"
```

---

## Task 2: Pure Member Helpers

**Files:**
- Create: `lib/members.ts`
- Create: `lib/__tests__/members.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/members.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { addMember, updateMember, removeMember } from "@/lib/members";
import type { Member } from "@/lib/types";

const base = (): Omit<Member, "memberId"> => ({
  name: "Budi",
  email: null,
  phone: null,
  deposit: 0,
});

describe("addMember", () => {
  it("adds to an empty list and assigns a memberId", () => {
    const result = addMember([], base());
    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBeTruthy();
    expect(result[0].name).toBe("Budi");
  });

  it("adds to an existing list with a different memberId", () => {
    const first = addMember([], { ...base(), name: "A" });
    const second = addMember(first, { ...base(), name: "B" });
    expect(second).toHaveLength(2);
    expect(second[1].name).toBe("B");
    expect(second[0].memberId).not.toBe(second[1].memberId);
  });

  it("does not mutate the original array", () => {
    const original: Member[] = [];
    addMember(original, base());
    expect(original).toHaveLength(0);
  });
});

describe("updateMember", () => {
  it("updates the named member and leaves others unchanged", () => {
    const [a, b] = addMember(addMember([], { ...base(), name: "A" }), { ...base(), name: "B" });
    const result = updateMember([a, b], a.memberId, { name: "A2", deposit: 50000 });
    expect(result[0].name).toBe("A2");
    expect(result[0].deposit).toBe(50000);
    expect(result[1].name).toBe("B");
  });

  it("does not change memberId", () => {
    const [m] = addMember([], base());
    const result = updateMember([m], m.memberId, { name: "X" });
    expect(result[0].memberId).toBe(m.memberId);
  });

  it("returns same-shape list if memberId not found", () => {
    const [m] = addMember([], base());
    const result = updateMember([m], "nonexistent", { name: "X" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Budi");
  });

  it("does not mutate the original array", () => {
    const [m] = addMember([], base());
    const original = [m];
    updateMember(original, m.memberId, { name: "X" });
    expect(original[0].name).toBe("Budi");
  });
});

describe("removeMember", () => {
  it("removes the named member", () => {
    const [a, b] = addMember(addMember([], { ...base(), name: "A" }), { ...base(), name: "B" });
    const result = removeMember([a, b], a.memberId);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("B");
  });

  it("removes the last member returning an empty array", () => {
    const [m] = addMember([], base());
    expect(removeMember([m], m.memberId)).toHaveLength(0);
  });

  it("does not mutate the original array", () => {
    const [m] = addMember([], base());
    const original = [m];
    removeMember(original, m.memberId);
    expect(original).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run lib/__tests__/members.test.ts
```

Expected: FAIL — `lib/members` module not found.

- [ ] **Step 3: Implement `lib/members.ts`**

Create `lib/members.ts`:

```ts
import type { Member } from "@/lib/types";

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function addMember(members: Member[], input: Omit<Member, "memberId">): Member[] {
  return [...members, { ...input, memberId: uid() }];
}

export function updateMember(
  members: Member[],
  memberId: string,
  patch: Partial<Omit<Member, "memberId">>
): Member[] {
  return members.map((m) => (m.memberId === memberId ? { ...m, ...patch } : m));
}

export function removeMember(members: Member[], memberId: string): Member[] {
  return members.filter((m) => m.memberId !== memberId);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run lib/__tests__/members.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Full test suite + type check**

```
npx vitest run
```

Expected: all existing tests still PASS (no regression).

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```
git add lib/members.ts lib/__tests__/members.test.ts
git commit -m "feat: add pure member array helpers (add/update/remove)"
```

---

## Task 3: RestaurantRepository Seam

**Files:**
- Create: `lib/data/restaurant-repo/types.ts`
- Create: `lib/data/restaurant-repo/mock-repo.ts`
- Create: `lib/data/restaurant-repo/index.ts`
- Create: `lib/data/restaurant-repo/__tests__/mock-repo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/data/restaurant-repo/__tests__/mock-repo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockRestaurantRepo } from "@/lib/data/restaurant-repo/mock-repo";

describe("mockRestaurantRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a restaurant with defaults", async () => {
    const r = await mockRestaurantRepo.create({
      sessionId: "s1",
      name: "Depot Bu Sri",
    });
    expect(r.restaurantId).toBeTruthy();
    expect(r.sessionId).toBe("s1");
    expect(r.taxIncluded).toBe(false);
    expect(r.taxRate).toBe(11);
    expect(r.totalAmount).toBeNull();
    expect(r.date).toBeNull();
    expect(r.order).toBe(0);
  });

  it("honors explicit fields on create", async () => {
    const r = await mockRestaurantRepo.create({
      sessionId: "s1",
      name: "X",
      taxIncluded: true,
      taxRate: 10,
      totalAmount: 500000,
      date: "2025-06-01",
      order: 2,
    });
    expect(r.taxIncluded).toBe(true);
    expect(r.taxRate).toBe(10);
    expect(r.totalAmount).toBe(500000);
    expect(r.date).toBe("2025-06-01");
    expect(r.order).toBe(2);
  });

  it("lists restaurants sorted by order, scoped to sessionId", async () => {
    await mockRestaurantRepo.create({ sessionId: "s1", name: "A", order: 1 });
    await mockRestaurantRepo.create({ sessionId: "s1", name: "B", order: 0 });
    await mockRestaurantRepo.create({ sessionId: "s2", name: "Other", order: 0 });
    const list = await mockRestaurantRepo.list("s1");
    expect(list.map((r) => r.name)).toEqual(["B", "A"]);
  });

  it("append-order defaults to current list length", async () => {
    await mockRestaurantRepo.create({ sessionId: "s1", name: "A" });
    const b = await mockRestaurantRepo.create({ sessionId: "s1", name: "B" });
    expect(b.order).toBe(1);
  });

  it("updates only specified fields", async () => {
    const r = await mockRestaurantRepo.create({ sessionId: "s1", name: "X" });
    await mockRestaurantRepo.update("s1", r.restaurantId, { name: "Y", totalAmount: 300000 });
    const updated = await mockRestaurantRepo.get("s1", r.restaurantId);
    expect(updated?.name).toBe("Y");
    expect(updated?.totalAmount).toBe(300000);
    expect(updated?.restaurantId).toBe(r.restaurantId);
  });

  it("deletes a restaurant", async () => {
    const r = await mockRestaurantRepo.create({ sessionId: "s1", name: "Gone" });
    await mockRestaurantRepo.delete("s1", r.restaurantId);
    expect(await mockRestaurantRepo.get("s1", r.restaurantId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockRestaurantRepo.get("s1", "nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run lib/data/restaurant-repo/__tests__/mock-repo.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the interface**

Create `lib/data/restaurant-repo/types.ts`:

```ts
import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";

export interface RestaurantRepository {
  list(sessionId: string): Promise<Restaurant[]>;
  get(sessionId: string, restaurantId: string): Promise<Restaurant | null>;
  create(input: NewRestaurantInput): Promise<Restaurant>;
  update(sessionId: string, restaurantId: string, patch: RestaurantPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string): Promise<void>;
}
```

- [ ] **Step 4: Create the mock repo**

Create `lib/data/restaurant-repo/mock-repo.ts`:

```ts
import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";
import type { RestaurantRepository } from "./types";

function storageKey(sessionId: string): string {
  return `splitbro:restaurants:${sessionId}`;
}

function readAll(sessionId: string): Restaurant[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId));
  return raw ? (JSON.parse(raw) as Restaurant[]) : [];
}

function writeAll(sessionId: string, restaurants: Restaurant[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId), JSON.stringify(restaurants));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockRestaurantRepo: RestaurantRepository = {
  async list(sessionId) {
    return readAll(sessionId).sort((a, b) => a.order - b.order);
  },

  async get(sessionId, restaurantId) {
    return readAll(sessionId).find((r) => r.restaurantId === restaurantId) ?? null;
  },

  async create(input: NewRestaurantInput) {
    const all = readAll(input.sessionId);
    const restaurant: Restaurant = {
      restaurantId: uid(),
      sessionId: input.sessionId,
      name: input.name,
      date: input.date ?? null,
      order: input.order ?? all.length,
      taxIncluded: input.taxIncluded ?? false,
      taxRate: input.taxRate ?? 11,
      totalAmount: input.totalAmount ?? null,
    };
    writeAll(input.sessionId, [...all, restaurant]);
    return restaurant;
  },

  async update(sessionId, restaurantId, patch: RestaurantPatch) {
    const all = readAll(sessionId);
    const idx = all.findIndex((r) => r.restaurantId === restaurantId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, all);
  },

  async delete(sessionId, restaurantId) {
    writeAll(sessionId, readAll(sessionId).filter((r) => r.restaurantId !== restaurantId));
  },
};
```

- [ ] **Step 5: Create the factory**

Create `lib/data/restaurant-repo/index.ts`:

```ts
import type { RestaurantRepository } from "./types";
import { mockRestaurantRepo } from "./mock-repo";

export function getRestaurantRepo(): RestaurantRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase restaurant backend not yet implemented");
  }
  return mockRestaurantRepo;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```
npx vitest run lib/data/restaurant-repo/__tests__/mock-repo.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 7: Full test suite + type check**

```
npx vitest run
```

Expected: all tests PASS.

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```
git add lib/data/restaurant-repo/
git commit -m "feat: add RestaurantRepository interface, mock, and factory"
```

---

## Task 4: useRestaurants and useSession Hooks

**Files:**
- Create: `lib/data/use-restaurants.ts`
- Create: `lib/data/use-session.ts`

These are thin wrappers; tested via type check rather than Vitest.

- [ ] **Step 1: Create `lib/data/use-restaurants.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewRestaurantInput, Restaurant, RestaurantPatch } from "@/lib/types";
import { getRestaurantRepo } from "./restaurant-repo/index";

export function useRestaurants(sessionId: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getRestaurantRepo();
    setLoading(true);
    setRestaurants(await repo.list(sessionId));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewRestaurantInput, "sessionId">) => {
      const repo = getRestaurantRepo();
      const r = await repo.create({ ...input, sessionId });
      await refresh();
      return r;
    },
    [sessionId, refresh]
  );

  const update = useCallback(
    async (restaurantId: string, patch: RestaurantPatch) => {
      const repo = getRestaurantRepo();
      await repo.update(sessionId, restaurantId, patch);
      await refresh();
    },
    [sessionId, refresh]
  );

  const remove = useCallback(
    async (restaurantId: string) => {
      const repo = getRestaurantRepo();
      await repo.delete(sessionId, restaurantId);
      await refresh();
    },
    [sessionId, refresh]
  );

  return { restaurants, loading, add, update, remove, refresh };
}
```

- [ ] **Step 2: Create `lib/data/use-session.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, SessionPatch } from "@/lib/types";
import { getSessionRepo } from "./index";

export function useSession(id: string, adminId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!adminId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const s = await getSessionRepo().get(id);
    // only expose session that belongs to this admin
    setSession(s?.adminId === adminId ? s : null);
    setLoading(false);
  }, [id, adminId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: SessionPatch) => {
      await getSessionRepo().update(id, patch);
      await refresh();
    },
    [id, refresh]
  );

  return { session, loading, update, refresh };
}
```

- [ ] **Step 3: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add lib/data/use-restaurants.ts lib/data/use-session.ts
git commit -m "feat: add useRestaurants and useSession hooks"
```

---

## Task 5: i18n Keys

**Files:**
- Modify: `lib/i18n/dictionaries.ts`

The existing parity test (`lib/i18n/__tests__/dictionaries.test.ts`) enforces that `id` and `en` dictionaries have identical keys and no empty strings. Run it to confirm the new keys are correct.

- [ ] **Step 1: Run the parity test — confirm it currently passes**

```
npx vitest run lib/i18n/__tests__/dictionaries.test.ts
```

Expected: PASS.

- [ ] **Step 2: Add new keys to both `id` and `en` dictionaries in `lib/i18n/dictionaries.ts`**

In the `id` dictionary, append after `"session.notFound"`:

```ts
    "session.hub.members": "Peserta",
    "session.hub.payment": "Info Pembayaran",
    "session.hub.restaurants": "Restoran",
    "member.title": "Peserta",
    "member.add": "Tambah Peserta",
    "member.edit.title": "Ubah Peserta",
    "member.empty": "Belum ada peserta.",
    "member.field.name": "Nama",
    "member.field.name.required": "Nama wajib diisi.",
    "member.field.email": "Email",
    "member.field.phone": "No. HP",
    "member.field.deposit": "Deposit (IDR)",
    "member.delete.confirm": "Hapus peserta ini?",
    "payment.title": "Info Pembayaran",
    "payment.field.bankName": "Nama Bank",
    "payment.field.accountNumber": "No. Rekening",
    "payment.field.accountName": "Atas Nama",
    "payment.field.ewallet": "E-Wallet",
    "payment.field.note": "Catatan",
    "restaurant.title": "Restoran",
    "restaurant.add": "Tambah Restoran",
    "restaurant.edit.title": "Ubah Restoran",
    "restaurant.empty": "Belum ada restoran.",
    "restaurant.field.name": "Nama Restoran",
    "restaurant.field.name.required": "Nama restoran wajib diisi.",
    "restaurant.field.date": "Tanggal",
    "restaurant.field.taxIncluded": "Harga sudah include PPN?",
    "restaurant.field.taxRate": "Tarif PPN (%)",
    "restaurant.field.totalAmount": "Total Tagihan (IDR)",
    "restaurant.items.placeholder": "Kelola Item — tersedia di fase berikutnya",
    "restaurant.delete.confirm": "Hapus restoran ini?",
    "restaurant.tax.included": "Sudah include PPN",
```

In the `en` dictionary, append after `"session.notFound"`:

```ts
    "session.hub.members": "Members",
    "session.hub.payment": "Payment Info",
    "session.hub.restaurants": "Restaurants",
    "member.title": "Members",
    "member.add": "Add Member",
    "member.edit.title": "Edit Member",
    "member.empty": "No members yet.",
    "member.field.name": "Name",
    "member.field.name.required": "Name is required.",
    "member.field.email": "Email",
    "member.field.phone": "Phone",
    "member.field.deposit": "Deposit (IDR)",
    "member.delete.confirm": "Remove this member?",
    "payment.title": "Payment Info",
    "payment.field.bankName": "Bank Name",
    "payment.field.accountNumber": "Account Number",
    "payment.field.accountName": "Account Name",
    "payment.field.ewallet": "E-Wallet",
    "payment.field.note": "Note",
    "restaurant.title": "Restaurants",
    "restaurant.add": "Add Restaurant",
    "restaurant.edit.title": "Edit Restaurant",
    "restaurant.empty": "No restaurants yet.",
    "restaurant.field.name": "Restaurant Name",
    "restaurant.field.name.required": "Restaurant name is required.",
    "restaurant.field.date": "Date",
    "restaurant.field.taxIncluded": "Price includes tax?",
    "restaurant.field.taxRate": "VAT rate (%)",
    "restaurant.field.totalAmount": "Total Bill (IDR)",
    "restaurant.items.placeholder": "Manage Items — available in next phase",
    "restaurant.delete.confirm": "Delete this restaurant?",
    "restaurant.tax.included": "Tax included",
```

- [ ] **Step 3: Run parity test — expect PASS**

```
npx vitest run lib/i18n/__tests__/dictionaries.test.ts
```

Expected: PASS. If key count mismatches, you missed a key in one language — fix before proceeding.

- [ ] **Step 4: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```
git add lib/i18n/dictionaries.ts
git commit -m "feat: add i18n keys for members, payment, restaurants, and hub"
```

---

## Task 6: Session Hub Refactor

**Files:**
- Modify: `app/(app)/sessions/[id]/page.tsx`

Replaces the current standalone SessionForm edit page with a hub that has navigation cards and links to sub-routes.

- [ ] **Step 1: Replace the entire content of `app/(app)/sessions/[id]/page.tsx`**

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

- [ ] **Step 2: Type check**

```
npx tsc --noEmit
```

Expected: no errors. If you see an error about `getSessionRepo` not being exported from `@/lib/data/index`, check that the file exports `getSessionRepo` (it does — it's the factory from Task 3 of 1A).

- [ ] **Step 3: Commit**

```
git add app/\(app\)/sessions/\[id\]/page.tsx
git commit -m "feat: refactor session [id] page to hub with nav cards"
```

---

## Task 7: Members CRUD

**Files:**
- Create: `components/members/MemberForm.tsx`
- Create: `components/members/MemberList.tsx`
- Create: `app/(app)/sessions/[id]/members/page.tsx`

- [ ] **Step 1: Create `components/members/MemberForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface MemberFormValues {
  name: string;
  email: string | null;
  phone: string | null;
  deposit: number;
}

export function MemberForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<MemberFormValues>;
  onSubmit: (values: MemberFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [deposit, setDeposit] = useState(String(initial?.deposit ?? 0));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("member.field.name.required"));
      return;
    }
    setError(null);
    const parsed = parseInt(deposit, 10);
    onSubmit({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      deposit: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("member.field.name")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.email")}</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label={t("member.field.email")}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.phone")}</span>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} aria-label={t("member.field.phone")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.deposit")}</span>
        <Input
          type="number"
          min="0"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          aria-label={t("member.field.deposit")}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
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

- [ ] **Step 2: Create `components/members/MemberList.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { MemberForm, type MemberFormValues } from "./MemberForm";

export function MemberList({
  members,
  onUpdate,
  onRemove,
}: {
  members: Member[];
  onUpdate: (memberId: string, values: MemberFormValues) => void;
  onRemove: (memberId: string) => void;
}) {
  const { t } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (members.length === 0) {
    return <p className="text-sm text-gray-500">{t("member.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {members.map((m) => (
        <Card key={m.memberId}>
          {editingId === m.memberId ? (
            <MemberForm
              initial={{ name: m.name, email: m.email, phone: m.phone, deposit: m.deposit }}
              onSubmit={(values) => {
                onUpdate(m.memberId, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmingId === m.memberId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("member.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    onRemove(m.memberId);
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
                <p className="font-medium">{m.name}</p>
                {m.email && <p className="text-sm text-gray-500">{m.email}</p>}
                {m.phone && <p className="text-sm text-gray-500">{m.phone}</p>}
                <p className="text-sm">{formatIDR(m.deposit)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setEditingId(m.memberId)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" onClick={() => setConfirmingId(m.memberId)}>
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

- [ ] **Step 3: Create `app/(app)/sessions/[id]/members/page.tsx`**

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { addMember, updateMember, removeMember } from "@/lib/members";
import { MemberForm } from "@/components/members/MemberForm";
import { MemberList } from "@/components/members/MemberList";
import { Button } from "@/components/ui/Button";

function MembersInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading, update } = useSession(id, user?.uid ?? null);
  const [adding, setAdding] = useState(false);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("member.title")}</h1>

      <MemberList
        members={session.members}
        onUpdate={async (memberId, values) => {
          await update({ members: updateMember(session.members, memberId, values) });
        }}
        onRemove={async (memberId) => {
          await update({ members: removeMember(session.members, memberId) });
        }}
      />

      <div className="mt-4">
        {adding ? (
          <MemberForm
            onSubmit={async (values) => {
              await update({ members: addMember(session.members, values) });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("member.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <MembersInner id={id} />
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
git add components/members/ app/\(app\)/sessions/\[id\]/members/
git commit -m "feat: add Members CRUD (MemberForm, MemberList, members sub-route)"
```

---

## Task 8: Payment Info

**Files:**
- Create: `components/payment/PaymentInfoForm.tsx`
- Create: `app/(app)/sessions/[id]/payment/page.tsx`

- [ ] **Step 1: Create `components/payment/PaymentInfoForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { PaymentInfo } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PaymentInfoForm({
  initial,
  onSubmit,
}: {
  initial: PaymentInfo;
  onSubmit: (info: PaymentInfo) => void;
}) {
  const { t } = useT();
  const [bankName, setBankName] = useState(initial.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber ?? "");
  const [accountName, setAccountName] = useState(initial.accountName ?? "");
  const [ewallet, setEwallet] = useState(initial.ewallet ?? "");
  const [note, setNote] = useState(initial.note ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      bankName: bankName.trim() || null,
      accountNumber: accountNumber.trim() || null,
      accountName: accountName.trim() || null,
      ewallet: ewallet.trim() || null,
      note: note.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.bankName")}</span>
        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.accountNumber")}</span>
        <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.accountName")}</span>
        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.ewallet")}</span>
        <Input value={ewallet} onChange={(e) => setEwallet(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.note")}</span>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Button type="submit">{t("common.save")}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/(app)/sessions/[id]/payment/page.tsx`**

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { PaymentInfoForm } from "@/components/payment/PaymentInfoForm";

function PaymentInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading, update } = useSession(id, user?.uid ?? null);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("payment.title")}</h1>
      <PaymentInfoForm
        initial={session.paymentInfo}
        onSubmit={async (info) => {
          await update({ paymentInfo: info });
        }}
      />
    </main>
  );
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <PaymentInner id={id} />
    </AuthGuard>
  );
}
```

- [ ] **Step 3: Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add components/payment/ app/\(app\)/sessions/\[id\]/payment/
git commit -m "feat: add Payment Info form and payment sub-route"
```

---

## Task 9: Restaurants CRUD

**Files:**
- Create: `components/restaurants/RestaurantForm.tsx`
- Create: `components/restaurants/RestaurantList.tsx`
- Create: `app/(app)/sessions/[id]/restaurants/page.tsx`

- [ ] **Step 1: Create `components/restaurants/RestaurantForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface RestaurantFormValues {
  name: string;
  date: string | null;
  taxIncluded: boolean;
  taxRate: number;
  totalAmount: number | null;
}

export function RestaurantForm({
  initial,
  sessionMode,
  defaultTaxRate,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<RestaurantFormValues>;
  sessionMode: SessionMode;
  defaultTaxRate: number;
  onSubmit: (values: RestaurantFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [taxIncluded, setTaxIncluded] = useState(initial?.taxIncluded ?? false);
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? defaultTaxRate));
  const [totalAmount, setTotalAmount] = useState(
    initial?.totalAmount != null ? String(initial.totalAmount) : ""
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("restaurant.field.name.required"));
      return;
    }
    setError(null);
    const parsedTax = parseInt(taxRate, 10);
    const parsedTotal = parseFloat(totalAmount);
    onSubmit({
      name: name.trim(),
      date: date.trim() || null,
      taxIncluded,
      taxRate: Number.isNaN(parsedTax) ? defaultTaxRate : parsedTax,
      totalAmount:
        sessionMode === "equal" && !Number.isNaN(parsedTotal) && parsedTotal >= 0
          ? parsedTotal
          : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("restaurant.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("restaurant.field.date")}</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={taxIncluded}
          onChange={(e) => setTaxIncluded(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm font-medium">{t("restaurant.field.taxIncluded")}</span>
      </label>
      {!taxIncluded && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("restaurant.field.taxRate")}</span>
          <Input
            type="number"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </label>
      )}
      {sessionMode === "equal" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("restaurant.field.totalAmount")}</span>
          <Input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </label>
      )}
      {sessionMode === "item_based" && (
        <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-500">
          {t("restaurant.items.placeholder")}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
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

- [ ] **Step 2: Create `components/restaurants/RestaurantList.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/format";
import { RestaurantForm, type RestaurantFormValues } from "./RestaurantForm";

export function RestaurantList({
  restaurants,
  sessionMode,
  defaultTaxRate,
  onUpdate,
  onRemove,
}: {
  restaurants: Restaurant[];
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

- [ ] **Step 3: Create `app/(app)/sessions/[id]/restaurants/page.tsx`**

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";
import { RestaurantList } from "@/components/restaurants/RestaurantList";
import { Button } from "@/components/ui/Button";

function RestaurantsInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { restaurants, loading: restoLoading, add, update, remove } = useRestaurants(id);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || restoLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("restaurant.title")}</h1>

      <RestaurantList
        restaurants={restaurants}
        sessionMode={session.mode}
        defaultTaxRate={session.defaultTaxRate}
        onUpdate={async (restaurantId, values) => {
          await update(restaurantId, values);
        }}
        onRemove={async (restaurantId) => {
          await remove(restaurantId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <RestaurantForm
            sessionMode={session.mode}
            defaultTaxRate={session.defaultTaxRate}
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("restaurant.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function RestaurantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <RestaurantsInner id={id} />
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
git add components/restaurants/ app/\(app\)/sessions/\[id\]/restaurants/
git commit -m "feat: add Restaurants CRUD (RestaurantForm, RestaurantList, restaurants sub-route)"
```

---

## Final Verification

- [ ] **Run full test suite**

```
npx vitest run
```

Expected: all tests PASS (≥27 from 1A + new tests from T2 and T3).

- [ ] **Type check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Build check**

```
npm run build
```

Expected: build succeeds with no TypeScript errors.
