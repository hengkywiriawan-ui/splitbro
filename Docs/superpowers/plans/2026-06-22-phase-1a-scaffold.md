# Phase 1A — Scaffold, Mock Auth & Session Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a mobile-first Next.js app where a (mock-authenticated) Admin can create, list, edit, close, and delete bill-splitting sessions with a locked split mode — all backed by a localStorage mock layer behind clean interfaces.

**Architecture:** Next.js App Router + TypeScript (strict) + Tailwind. All auth and data access go through `AuthProvider` and `SessionRepository` interfaces; this slice ships localStorage-backed mock implementations selected by a factory (`NEXT_PUBLIC_BACKEND`, default `mock`). UI calls React-context hooks only and never imports a concrete backend, so a Firebase implementation can drop into the same interfaces later with no UI changes.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, Vitest + Testing Library (jsdom), localStorage.

**Reference:** `docs/PRD_SplitBro.md` (§2, §3, FR-1, FR-2), `.claude/rules/firestore-schema.md`, `.claude/rules/conventions.md`, and the design at `docs/superpowers/specs/2026-06-22-phase-1a-scaffold-design.md`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/types.ts` | Shared domain types mirroring the Firestore schema (`User`, `Session`, `Member`, `PaymentInfo`, `NewSessionInput`). |
| `lib/format.ts` | `formatIDR()` — single currency formatter. |
| `lib/auth/types.ts` | `AuthProvider` interface. |
| `lib/auth/mock-auth.ts` | localStorage mock auth implementation. |
| `lib/auth/index.ts` | `getAuthProvider()` factory (mock now, firebase later). |
| `lib/auth/provider.tsx` | `AuthContext`, `AuthGuard` data, `useAuth()` hook. |
| `lib/data/types.ts` | `SessionRepository` interface. |
| `lib/data/mock-repo.ts` | localStorage mock session repository. |
| `lib/data/index.ts` | `getSessionRepo()` factory. |
| `lib/data/use-sessions.ts` | `useSessions()` / `useSession()` hooks wrapping the repo. |
| `lib/i18n/dictionaries.ts` | `id` + `en` string dictionaries. |
| `lib/i18n/provider.tsx` | `I18nProvider`, `useT()`, language persistence. |
| `components/ui/*` | `Button`, `Input`, `Card`, `Badge`, `Toast`, `LangToggle`. |
| `components/auth/LoginForm.tsx` | Login UI. |
| `components/auth/AuthGuard.tsx` | Redirect wrapper for protected routes. |
| `components/sessions/ModePicker.tsx` | Two-card mode selector. |
| `components/sessions/SessionForm.tsx` | Create/edit form (mode locked on edit). |
| `components/sessions/SessionList.tsx` | Session cards + empty state. |
| `components/sessions/DeleteConfirm.tsx` | Delete confirmation modal. |
| `app/layout.tsx` | Root layout, providers, lang toggle. |
| `app/(auth)/login/page.tsx` | Login route. |
| `app/(app)/sessions/page.tsx` | Session list route. |
| `app/(app)/sessions/new/page.tsx` | Create route. |
| `app/(app)/sessions/[id]/page.tsx` | Detail/edit route. |

---

## Task 1: Consolidate starter files to repo root

**Files:**
- Move: `files/splitbro_claude_code_starter/splitbro/docs/PRD_SplitBro.md` → `docs/PRD_SplitBro.md`
- Move: `files/splitbro_claude_code_starter/splitbro/.claude/rules/*.md` → `.claude/rules/`
- Move: `files/splitbro_claude_code_starter/splitbro/prompts/*` → `prompts/`
- Move: `files/splitbro_claude_code_starter/splitbro/.env.example` → `.env.example`
- Remove: `files/` (zip, nested duplicates, stray `files/CLAUDE.md`, `files/PRD_SplitBro.md`)
- Modify: `CLAUDE.md` (fix nested paths → root paths)

- [ ] **Step 1: Move the canonical spec/rule/prompt files to root**

```bash
mkdir -p .claude/rules prompts docs
git mv "files/splitbro_claude_code_starter/splitbro/docs/PRD_SplitBro.md" docs/PRD_SplitBro.md
git mv files/splitbro_claude_code_starter/splitbro/.claude/rules/calculation-engine.md .claude/rules/calculation-engine.md
git mv files/splitbro_claude_code_starter/splitbro/.claude/rules/firestore-schema.md .claude/rules/firestore-schema.md
git mv files/splitbro_claude_code_starter/splitbro/.claude/rules/conventions.md .claude/rules/conventions.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/README.md prompts/README.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/phase-1a-setup-auth-session.md prompts/phase-1a-setup-auth-session.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/phase-1b-members-restaurants.md prompts/phase-1b-members-restaurants.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/phase-1c-items-calculation.md prompts/phase-1c-items-calculation.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/phase-1d-summary-export.md prompts/phase-1d-summary-export.md
git mv files/splitbro_claude_code_starter/splitbro/prompts/phase-1e-i18n-pwa-ocr.md prompts/phase-1e-i18n-pwa-ocr.md
git mv files/splitbro_claude_code_starter/splitbro/.env.example .env.example
```

- [ ] **Step 2: Remove the leftover `files/` tree**

```bash
git rm -r files
```

- [ ] **Step 3: Fix paths in root `CLAUDE.md`**

In `CLAUDE.md`, replace every `files/splitbro_claude_code_starter/splitbro/` prefix with the root path. The "Current state" block and any inline references should read `docs/PRD_SplitBro.md`, `.claude/rules/...`, `prompts/...`. Remove the sentence noting the files are "nested" — they no longer are.

- [ ] **Step 4: Verify the tree**

Run: `ls .claude/rules docs prompts && test ! -d files && echo "files/ removed"`
Expected: lists the three rule files, `PRD_SplitBro.md`, the prompt files, and prints `files/ removed`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: consolidate starter spec files to repo root"
```

---

## Task 2: Scaffold Next.js app + test tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `tailwind` config (via create-next-app)
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Scaffold Next.js at the repo root**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --no-turbopack
```
Expected: project files created (`package.json`, `app/`, `tsconfig.json`). If create-next-app refuses because the directory is non-empty, scaffold into a temp dir and move files up: `npx create-next-app@latest .splitbro-tmp --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --no-turbopack` then move its contents (including dotfiles) into the repo root and delete `.splitbro-tmp`. Keep the existing `.gitignore`, `CLAUDE.md`, `docs/`, `.claude/`, `prompts/`, `Docs/`.

- [ ] **Step 2: Install test tooling**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: dependencies added, no errors.

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
```

Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

- [ ] **Step 4: Add scripts to `package.json`**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Confirm strict mode and a green baseline**

Confirm `tsconfig.json` has `"strict": true` (create-next-app sets this; if absent, add it under `compilerOptions`).
Run: `npm run typecheck`
Expected: no errors.
Run: `npm run dev` then open the printed URL, confirm the default page renders, then stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest tooling"
```

---

## Task 3: Domain types

**Files:**
- Create: `lib/types.ts`
- Test: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test** (a compile-level smoke test that the shapes exist and are constructible)

Create `lib/__tests__/types.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import type { Session, User, NewSessionInput } from "@/lib/types";

describe("domain types", () => {
  it("constructs a Session with required fields", () => {
    const session: Session = {
      id: "s1",
      name: "Trip Kediri",
      adminId: "admin1",
      mode: "equal",
      currency: "IDR",
      defaultTaxRate: 11,
      status: "active",
      shareToken: "tok",
      paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
      members: [],
      createdAt: 1,
      updatedAt: 1,
    };
    expect(session.mode).toBe("equal");
  });

  it("constructs a User and NewSessionInput", () => {
    const user: User = { uid: "u1", email: "a@b.c", displayName: "A", photoURL: null };
    const input: NewSessionInput = { name: "X", mode: "item_based", adminId: "u1" };
    expect(user.uid).toBe("u1");
    expect(input.mode).toBe("item_based");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/types.test.ts`
Expected: FAIL — cannot find module `@/lib/types`.

- [ ] **Step 3: Write the types**

Create `lib/types.ts`:
```ts
export type SessionMode = "equal" | "item_based";
export type SessionStatus = "active" | "closed";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface PaymentInfo {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  ewallet: string | null;
  note: string | null;
}

export interface Member {
  memberId: string;
  name: string;
  email: string | null;
  phone: string | null;
  deposit: number;
}

export interface Session {
  id: string;
  name: string;
  adminId: string;
  mode: SessionMode;
  currency: "IDR";
  defaultTaxRate: number;
  status: SessionStatus;
  shareToken: string;
  paymentInfo: PaymentInfo;
  members: Member[];
  createdAt: number; // epoch ms in mock; maps to Firestore Timestamp later
  updatedAt: number;
}

export interface NewSessionInput {
  name: string;
  mode: SessionMode;
  adminId: string;
  defaultTaxRate?: number; // defaults to 11 in the repository
}

export const EMPTY_PAYMENT_INFO: PaymentInfo = {
  bankName: null,
  accountNumber: null,
  accountName: null,
  ewallet: null,
  note: null,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/__tests__/types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/__tests__/types.test.ts
git commit -m "feat: add shared domain types mirroring Firestore schema"
```

---

## Task 4: Currency formatter

**Files:**
- Create: `lib/format.ts`
- Test: `lib/__tests__/format.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatIDR } from "@/lib/format";

describe("formatIDR", () => {
  it("formats with thousands separators and rupiah prefix", () => {
    expect(formatIDR(1486400)).toBe("Rp 1.486.400");
  });
  it("rounds to the nearest rupiah at display time", () => {
    expect(formatIDR(1486400.4)).toBe("Rp 1.486.400");
    expect(formatIDR(1486400.6)).toBe("Rp 1.486.401");
  });
  it("formats zero", () => {
    expect(formatIDR(0)).toBe("Rp 0");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/format.test.ts`
Expected: FAIL — cannot find module `@/lib/format`.

- [ ] **Step 3: Write the implementation**

Create `lib/format.ts`:
```ts
/** Format an IDR amount for display. Rounding happens ONLY here, never in calculation. */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString("id-ID")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/__tests__/format.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts lib/__tests__/format.test.ts
git commit -m "feat: add formatIDR currency helper"
```

---

## Task 5: Auth interface + mock implementation + factory

**Files:**
- Create: `lib/auth/types.ts`, `lib/auth/mock-auth.ts`, `lib/auth/index.ts`
- Test: `lib/auth/__tests__/mock-auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/auth/__tests__/mock-auth.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockAuth } from "@/lib/auth/mock-auth";

describe("mockAuth", () => {
  beforeEach(() => localStorage.clear());

  it("starts signed out", async () => {
    expect(await mockAuth.getCurrentUser()).toBeNull();
  });

  it("signs in with Google and persists", async () => {
    const user = await mockAuth.signInWithGoogle();
    expect(user.uid).toBe("mock-admin");
    expect(await mockAuth.getCurrentUser()).toEqual(user);
  });

  it("signs in with email using the email as identity", async () => {
    const user = await mockAuth.signInWithEmail("a@b.c", "pw");
    expect(user.email).toBe("a@b.c");
    expect((await mockAuth.getCurrentUser())?.email).toBe("a@b.c");
  });

  it("signs out", async () => {
    await mockAuth.signInWithGoogle();
    await mockAuth.signOut();
    expect(await mockAuth.getCurrentUser()).toBeNull();
  });

  it("notifies subscribers on change and unsubscribes", async () => {
    const seen: (string | null)[] = [];
    const off = mockAuth.onAuthChange((u) => seen.push(u?.uid ?? null));
    await mockAuth.signInWithGoogle();
    off();
    await mockAuth.signOut();
    expect(seen).toEqual(["mock-admin"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/auth/__tests__/mock-auth.test.ts`
Expected: FAIL — cannot find module `@/lib/auth/mock-auth`.

- [ ] **Step 3: Write the interface, mock, and factory**

Create `lib/auth/types.ts`:
```ts
import type { User } from "@/lib/types";

export interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
}
```

Create `lib/auth/mock-auth.ts`:
```ts
import type { User } from "@/lib/types";
import type { AuthProvider } from "./types";

const KEY = "splitbro:auth";
const listeners = new Set<(u: User | null) => void>();

function read(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

function write(u: User | null): void {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
  else window.localStorage.removeItem(KEY);
  listeners.forEach((cb) => cb(u));
}

const MOCK_ADMIN: User = {
  uid: "mock-admin",
  email: "admin@splitbro.local",
  displayName: "Admin (Mock)",
  photoURL: null,
};

export const mockAuth: AuthProvider = {
  async getCurrentUser() {
    return read();
  },
  async signInWithGoogle() {
    write(MOCK_ADMIN);
    return MOCK_ADMIN;
  },
  async signInWithEmail(email: string) {
    const user: User = { ...MOCK_ADMIN, uid: `mock-${email}`, email, displayName: email };
    write(user);
    return user;
  },
  async signOut() {
    write(null);
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
```

Create `lib/auth/index.ts`:
```ts
import type { AuthProvider } from "./types";
import { mockAuth } from "./mock-auth";

export function getAuthProvider(): AuthProvider {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase auth backend not yet implemented");
  }
  return mockAuth;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/auth/__tests__/mock-auth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/
git commit -m "feat: add AuthProvider interface with localStorage mock"
```

---

## Task 6: Session repository interface + mock implementation + factory

**Files:**
- Create: `lib/data/types.ts`, `lib/data/mock-repo.ts`, `lib/data/index.ts`
- Test: `lib/data/__tests__/mock-repo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/data/__tests__/mock-repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockRepo } from "@/lib/data/mock-repo";

describe("mockRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a session with defaults and a unique share token", async () => {
    const a = await mockRepo.create({ name: "Trip A", mode: "equal", adminId: "admin1" });
    const b = await mockRepo.create({ name: "Trip B", mode: "item_based", adminId: "admin1" });
    expect(a.defaultTaxRate).toBe(11);
    expect(a.status).toBe("active");
    expect(a.currency).toBe("IDR");
    expect(a.members).toEqual([]);
    expect(a.shareToken).toBeTruthy();
    expect(a.shareToken).not.toBe(b.shareToken);
    expect(a.id).not.toBe(b.id);
  });

  it("honors an explicit defaultTaxRate", async () => {
    const s = await mockRepo.create({ name: "X", mode: "equal", adminId: "admin1", defaultTaxRate: 10 });
    expect(s.defaultTaxRate).toBe(10);
  });

  it("lists only sessions for the given admin, newest first", async () => {
    await mockRepo.create({ name: "A1", mode: "equal", adminId: "admin1" });
    await mockRepo.create({ name: "A2", mode: "equal", adminId: "admin1" });
    await mockRepo.create({ name: "B1", mode: "equal", adminId: "admin2" });
    const mine = await mockRepo.listByAdmin("admin1");
    expect(mine.map((s) => s.name)).toEqual(["A2", "A1"]);
  });

  it("updates the name and status but never the mode", async () => {
    const s = await mockRepo.create({ name: "Old", mode: "equal", adminId: "admin1" });
    await mockRepo.update(s.id, { name: "New", status: "closed", mode: "item_based" });
    const updated = await mockRepo.get(s.id);
    expect(updated?.name).toBe("New");
    expect(updated?.status).toBe("closed");
    expect(updated?.mode).toBe("equal");
  });

  it("deletes a session", async () => {
    const s = await mockRepo.create({ name: "Gone", mode: "equal", adminId: "admin1" });
    await mockRepo.delete(s.id);
    expect(await mockRepo.get(s.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/data/__tests__/mock-repo.test.ts`
Expected: FAIL — cannot find module `@/lib/data/mock-repo`.

- [ ] **Step 3: Write the interface, mock, and factory**

Create `lib/data/types.ts`:
```ts
import type { Session, NewSessionInput } from "@/lib/types";

export interface SessionRepository {
  listByAdmin(adminId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
  create(input: NewSessionInput): Promise<Session>;
  update(id: string, patch: Partial<Session>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Create `lib/data/mock-repo.ts`:
```ts
import type { Session, NewSessionInput } from "@/lib/types";
import { EMPTY_PAYMENT_INFO } from "@/lib/types";
import type { SessionRepository } from "./types";

const KEY = "splitbro:sessions";

function readAll(): Session[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session[]) : [];
}

function writeAll(sessions: Session[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(sessions));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockRepo: SessionRepository = {
  async listByAdmin(adminId) {
    return readAll()
      .filter((s) => s.adminId === adminId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async get(id) {
    return readAll().find((s) => s.id === id) ?? null;
  },

  async create(input: NewSessionInput) {
    const now = Date.now();
    const session: Session = {
      id: uid(),
      name: input.name,
      adminId: input.adminId,
      mode: input.mode,
      currency: "IDR",
      defaultTaxRate: input.defaultTaxRate ?? 11,
      status: "active",
      shareToken: uid(),
      paymentInfo: { ...EMPTY_PAYMENT_INFO },
      members: [],
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), session]);
    return session;
  },

  async update(id, patch) {
    const all = readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return;
    // Immutable fields are stripped: id, adminId, mode, shareToken, createdAt.
    const { id: _id, adminId: _admin, mode: _mode, shareToken: _tok, createdAt: _created, ...safe } = patch;
    void _id; void _admin; void _mode; void _tok; void _created;
    all[idx] = { ...all[idx], ...safe, updatedAt: Date.now() };
    writeAll(all);
  },

  async delete(id) {
    writeAll(readAll().filter((s) => s.id !== id));
  },
};
```

Create `lib/data/index.ts`:
```ts
import type { SessionRepository } from "./types";
import { mockRepo } from "./mock-repo";

export function getSessionRepo(): SessionRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase session backend not yet implemented");
  }
  return mockRepo;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/data/__tests__/mock-repo.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/data/
git commit -m "feat: add SessionRepository interface with localStorage mock"
```

---

## Task 7: i18n dictionaries + provider

**Files:**
- Create: `lib/i18n/dictionaries.ts`, `lib/i18n/provider.tsx`
- Test: `lib/i18n/__tests__/dictionaries.test.ts`

- [ ] **Step 1: Write the failing test** (every key present in both languages)

Create `lib/i18n/__tests__/dictionaries.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

describe("dictionaries", () => {
  it("has matching keys for id and en", () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(idKeys).toEqual(enKeys);
  });
  it("has no empty strings", () => {
    for (const lang of ["id", "en"] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        expect(value, `${lang}.${key}`).not.toBe("");
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/i18n/__tests__/dictionaries.test.ts`
Expected: FAIL — cannot find module `@/lib/i18n/dictionaries`.

- [ ] **Step 3: Write the dictionaries and provider**

Create `lib/i18n/dictionaries.ts`:
```ts
export type Lang = "id" | "en";

export const dictionaries = {
  id: {
    "app.title": "SplitBro",
    "common.cancel": "Batal",
    "common.save": "Simpan",
    "common.delete": "Hapus",
    "common.edit": "Ubah",
    "common.back": "Kembali",
    "lang.toggle": "EN",
    "login.title": "Masuk sebagai Admin",
    "login.google": "Masuk dengan Google",
    "login.email": "Email",
    "login.password": "Kata sandi",
    "login.submit": "Masuk",
    "login.error": "Gagal masuk. Coba lagi.",
    "sessions.title": "Sesi Saya",
    "sessions.new": "Sesi Baru",
    "sessions.empty": "Belum ada sesi. Buat sesi pertamamu.",
    "sessions.logout": "Keluar",
    "session.create.title": "Buat Sesi",
    "session.edit.title": "Ubah Sesi",
    "session.field.name": "Nama sesi",
    "session.field.name.required": "Nama sesi wajib diisi.",
    "session.field.mode": "Mode pembagian",
    "session.field.mode.required": "Pilih mode terlebih dahulu.",
    "session.field.taxRate": "Tarif PPN default (%)",
    "session.mode.locked": "Mode terkunci setelah sesi dibuat.",
    "session.mode.equal": "Bagi Rata",
    "session.mode.equal.desc": "Tagihan tiap restoran dibagi rata ke semua peserta.",
    "session.mode.item_based": "Per Item",
    "session.mode.item_based.desc": "Tiap orang bayar sesuai yang ia pesan.",
    "session.status.active": "Aktif",
    "session.status.closed": "Ditutup",
    "session.status.close": "Tutup sesi",
    "session.status.reopen": "Buka lagi",
    "session.delete.confirm": "Hapus sesi ini? Tindakan tidak bisa dibatalkan.",
  },
  en: {
    "app.title": "SplitBro",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "lang.toggle": "ID",
    "login.title": "Sign in as Admin",
    "login.google": "Sign in with Google",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.error": "Sign-in failed. Try again.",
    "sessions.title": "My Sessions",
    "sessions.new": "New Session",
    "sessions.empty": "No sessions yet. Create your first one.",
    "sessions.logout": "Sign out",
    "session.create.title": "Create Session",
    "session.edit.title": "Edit Session",
    "session.field.name": "Session name",
    "session.field.name.required": "Session name is required.",
    "session.field.mode": "Split mode",
    "session.field.mode.required": "Please choose a mode first.",
    "session.field.taxRate": "Default VAT rate (%)",
    "session.mode.locked": "Mode is locked once the session is created.",
    "session.mode.equal": "Equal Split",
    "session.mode.equal.desc": "Each restaurant bill is divided evenly across everyone.",
    "session.mode.item_based": "Item-Based",
    "session.mode.item_based.desc": "Each person pays for what they ordered.",
    "session.status.active": "Active",
    "session.status.closed": "Closed",
    "session.status.close": "Close session",
    "session.status.reopen": "Reopen",
    "session.delete.confirm": "Delete this session? This cannot be undone.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["id"];
```

Create `lib/i18n/provider.tsx`:
```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Lang, type TranslationKey } from "./dictionaries";

const LANG_KEY = "splitbro:lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "id" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback((key: TranslationKey) => dictionaries[lang][key], [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/i18n/__tests__/dictionaries.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/
git commit -m "feat: add bilingual i18n dictionaries and provider"
```

---

## Task 8: UI primitives

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Card.tsx`, `components/ui/Badge.tsx`, `components/ui/LangToggle.tsx`
- Test: `components/ui/__tests__/Button.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/__tests__/Button.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Tap" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/ui/__tests__/Button.test.tsx`
Expected: FAIL — cannot find module `@/components/ui/Button`.

- [ ] **Step 3: Write the primitives**

Create `components/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-11 rounded-lg px-4 py-2 text-base font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
```

Create `components/ui/Input.tsx`:
```tsx
import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-600 focus:outline-none ${className}`}
      {...props}
    />
  );
}
```

Create `components/ui/Card.tsx`:
```tsx
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}
```

Create `components/ui/Badge.tsx`:
```tsx
export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "blue" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
```

Create `components/ui/LangToggle.tsx`:
```tsx
"use client";

import { useT } from "@/lib/i18n/provider";
import { Button } from "./Button";

export function LangToggle() {
  const { lang, setLang, t } = useT();
  return (
    <Button variant="secondary" onClick={() => setLang(lang === "id" ? "en" : "id")}>
      {t("lang.toggle")}
    </Button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/ui/__tests__/Button.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add UI primitives (Button, Input, Card, Badge, LangToggle)"
```

---

## Task 9: Auth provider context + useAuth hook

**Files:**
- Create: `lib/auth/provider.tsx`
- Test: `lib/auth/__tests__/provider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `lib/auth/__tests__/provider.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProviderContext, useAuth } from "@/lib/auth/provider";

function Probe() {
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>user: {user?.uid ?? "none"}</p>
      <button onClick={() => signInGoogle()}>in</button>
      <button onClick={() => signOut()}>out</button>
    </div>
  );
}

describe("AuthProviderContext", () => {
  beforeEach(() => localStorage.clear());

  it("exposes auth state and sign-in/out", async () => {
    render(
      <AuthProviderContext>
        <Probe />
      </AuthProviderContext>
    );
    await waitFor(() => expect(screen.getByText("user: none")).toBeInTheDocument());
    await userEvent.click(screen.getByText("in"));
    await waitFor(() => expect(screen.getByText("user: mock-admin")).toBeInTheDocument());
    await userEvent.click(screen.getByText("out"));
    await waitFor(() => expect(screen.getByText("user: none")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/auth/__tests__/provider.test.tsx`
Expected: FAIL — cannot find module `@/lib/auth/provider`.

- [ ] **Step 3: Write the provider**

Create `lib/auth/provider.tsx`:
```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { getAuthProvider } from "./index";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProviderContext({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getAuthProvider(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    auth.getCurrentUser().then((u) => {
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    const off = auth.onAuthChange((u) => setUser(u));
    return () => {
      active = false;
      off();
    };
  }, [auth]);

  const value: AuthContextValue = {
    user,
    loading,
    signInGoogle: async () => void (await auth.signInWithGoogle()),
    signInEmail: async (email, password) => void (await auth.signInWithEmail(email, password)),
    signOut: async () => auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProviderContext");
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/auth/__tests__/provider.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/provider.tsx lib/auth/__tests__/provider.test.tsx
git commit -m "feat: add auth context provider and useAuth hook"
```

---

## Task 10: useSessions hook

**Files:**
- Create: `lib/data/use-sessions.ts`
- Test: `lib/data/__tests__/use-sessions.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `lib/data/__tests__/use-sessions.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessions } from "@/lib/data/use-sessions";

describe("useSessions", () => {
  beforeEach(() => localStorage.clear());

  it("loads, creates, and removes sessions for an admin", async () => {
    const { result } = renderHook(() => useSessions("admin1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toHaveLength(0);

    let createdId = "";
    await act(async () => {
      const s = await result.current.create({ name: "Trip", mode: "equal", adminId: "admin1" });
      createdId = s.id;
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    await act(async () => {
      await result.current.remove(createdId);
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(0));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/data/__tests__/use-sessions.test.tsx`
Expected: FAIL — cannot find module `@/lib/data/use-sessions`.

- [ ] **Step 3: Write the hook**

Create `lib/data/use-sessions.ts`:
```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewSessionInput, Session } from "@/lib/types";
import { getSessionRepo } from "./index";

export function useSessions(adminId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!adminId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    const repo = getSessionRepo();
    setSessions(await repo.listByAdmin(adminId));
    setLoading(false);
  }, [adminId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: NewSessionInput) => {
      const repo = getSessionRepo();
      const session = await repo.create(input);
      await refresh();
      return session;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Session>) => {
      const repo = getSessionRepo();
      await repo.update(id, patch);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const repo = getSessionRepo();
      await repo.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { sessions, loading, create, update, remove, refresh };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/data/__tests__/use-sessions.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/data/use-sessions.ts lib/data/__tests__/use-sessions.test.tsx
git commit -m "feat: add useSessions hook over the repository"
```

---

## Task 11: Session form + mode picker (locked-mode behavior)

**Files:**
- Create: `components/sessions/ModePicker.tsx`, `components/sessions/SessionForm.tsx`
- Test: `components/sessions/__tests__/SessionForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/sessions/__tests__/SessionForm.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/sessions/__tests__/SessionForm.test.tsx`
Expected: FAIL — cannot find module `@/components/sessions/SessionForm`.

- [ ] **Step 3: Write ModePicker and SessionForm**

Create `components/sessions/ModePicker.tsx`:
```tsx
"use client";

import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function ModePicker({
  value,
  onChange,
}: {
  value: SessionMode | null;
  onChange: (m: SessionMode) => void;
}) {
  const { t } = useT();
  const modes: SessionMode[] = ["equal", "item_based"];
  return (
    <div role="radiogroup" aria-label={t("session.field.mode")} className="grid grid-cols-1 gap-3">
      {modes.map((m) => {
        const selected = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`session.mode.${m}` as const)}
            onClick={() => onChange(m)}
            className={`rounded-xl border p-4 text-left ${selected ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="font-semibold">{t(`session.mode.${m}` as const)}</div>
            <div className="text-sm text-gray-600">{t(`session.mode.${m}.desc` as const)}</div>
          </button>
        );
      })}
    </div>
  );
}
```

Create `components/sessions/SessionForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModePicker } from "./ModePicker";

export interface SessionFormValues {
  name: string;
  mode: SessionMode;
  defaultTaxRate: number;
}

export function SessionForm({
  initial,
  mode = "create",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<SessionFormValues>;
  mode?: "create" | "edit";
  onSubmit: (values: SessionFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(initial?.mode ?? null);
  const [taxRate, setTaxRate] = useState(initial?.defaultTaxRate ?? 11);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("session.field.name.required"));
      return;
    }
    if (mode === "create" && !selectedMode) {
      setError(t("session.field.mode.required"));
      return;
    }
    setError(null);
    onSubmit({ name: name.trim(), mode: (initial?.mode ?? selectedMode) as SessionMode, defaultTaxRate: taxRate });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("session.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("session.field.name")} />
      </label>

      {mode === "create" ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("session.field.mode")}</span>
          <ModePicker value={selectedMode} onChange={setSelectedMode} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t("session.mode.locked")}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("session.field.taxRate")}</span>
        <Input
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(Number(e.target.value))}
          aria-label={t("session.field.taxRate")}
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/sessions/__tests__/SessionForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/sessions/ModePicker.tsx components/sessions/SessionForm.tsx components/sessions/__tests__/SessionForm.test.tsx
git commit -m "feat: add SessionForm with locked-mode editing and ModePicker"
```

---

## Task 12: SessionList + DeleteConfirm

**Files:**
- Create: `components/sessions/SessionList.tsx`, `components/sessions/DeleteConfirm.tsx`
- Test: `components/sessions/__tests__/SessionList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/sessions/__tests__/SessionList.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n/provider";
import { SessionList } from "@/components/sessions/SessionList";
import type { Session } from "@/lib/types";

const base: Omit<Session, "id" | "name" | "mode"> = {
  adminId: "admin1",
  currency: "IDR",
  defaultTaxRate: 11,
  status: "active",
  shareToken: "t",
  paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
  members: [],
  createdAt: 1,
  updatedAt: 1,
};

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("SessionList", () => {
  it("shows the empty state when there are no sessions", () => {
    wrap(<SessionList sessions={[]} onOpen={vi.fn()} />);
    expect(screen.getByText(/Belum ada sesi|No sessions yet/)).toBeInTheDocument();
  });

  it("renders one card per session with its mode label", () => {
    const sessions: Session[] = [
      { ...base, id: "1", name: "Trip A", mode: "equal" },
      { ...base, id: "2", name: "Trip B", mode: "item_based" },
    ];
    wrap(<SessionList sessions={sessions} onOpen={vi.fn()} />);
    expect(screen.getByText("Trip A")).toBeInTheDocument();
    expect(screen.getByText("Trip B")).toBeInTheDocument();
    expect(screen.getByText(/Bagi Rata|Equal Split/)).toBeInTheDocument();
    expect(screen.getByText(/Per Item|Item-Based/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/sessions/__tests__/SessionList.test.tsx`
Expected: FAIL — cannot find module `@/components/sessions/SessionList`.

- [ ] **Step 3: Write SessionList and DeleteConfirm**

Create `components/sessions/SessionList.tsx`:
```tsx
"use client";

import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SessionList({
  sessions,
  onOpen,
}: {
  sessions: Session[];
  onOpen: (id: string) => void;
}) {
  const { t } = useT();

  if (sessions.length === 0) {
    return <p className="py-12 text-center text-gray-500">{t("sessions.empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onOpen(s.id)} className="w-full text-left">
            <Card>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.name}</span>
                <Badge tone={s.status === "active" ? "green" : "gray"}>
                  {t(`session.status.${s.status}` as const)}
                </Badge>
              </div>
              <div className="mt-1">
                <Badge tone="blue">{t(`session.mode.${s.mode}` as const)}</Badge>
              </div>
            </Card>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Create `components/sessions/DeleteConfirm.tsx`:
```tsx
"use client";

import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-sm">
        <p className="mb-4">{t("session.delete.confirm")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t("common.delete")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/sessions/__tests__/SessionList.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/sessions/SessionList.tsx components/sessions/DeleteConfirm.tsx components/sessions/__tests__/SessionList.test.tsx
git commit -m "feat: add SessionList with empty state and DeleteConfirm modal"
```

---

## Task 13: Wire routes, layout, guard, and final gate

**Files:**
- Create: `components/auth/LoginForm.tsx`, `components/auth/AuthGuard.tsx`
- Modify: `app/layout.tsx`
- Create: `app/page.tsx` (redirect), `app/(auth)/login/page.tsx`, `app/(app)/sessions/page.tsx`, `app/(app)/sessions/new/page.tsx`, `app/(app)/sessions/[id]/page.tsx`

- [ ] **Step 1: Write the LoginForm**

Create `components/auth/LoginForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const { signInGoogle, signInEmail } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function go(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
      router.push("/sessions");
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <Card className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-4 text-xl font-bold">{t("login.title")}</h1>
      <Button className="w-full" onClick={() => go(signInGoogle)}>
        {t("login.google")}
      </Button>
      <div className="my-4 h-px bg-gray-200" />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void go(() => signInEmail(email, password));
        }}
      >
        <Input
          type="email"
          placeholder={t("login.email")}
          aria-label={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder={t("login.password")}
          aria-label={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="secondary">
          {t("login.submit")}
        </Button>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Write the AuthGuard**

Create `components/auth/AuthGuard.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Wire providers in the root layout**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { AuthProviderContext } from "@/lib/auth/provider";

export const metadata: Metadata = {
  title: "SplitBro",
  description: "Split trip bills accurately.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <I18nProvider>
          <AuthProviderContext>{children}</AuthProviderContext>
        </I18nProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Write the route pages**

Create `app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/sessions");
}
```

Create `app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

Create `app/(app)/sessions/page.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionList } from "@/components/sessions/SessionList";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "@/components/ui/LangToggle";

function SessionsInner() {
  const { user, signOut } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { sessions, loading } = useSessions(user?.uid ?? null);

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("sessions.title")}</h1>
        <div className="flex gap-2">
          <LangToggle />
          <Button variant="secondary" onClick={() => void signOut().then(() => router.push("/login"))}>
            {t("sessions.logout")}
          </Button>
        </div>
      </header>
      <Button className="mb-4 w-full" onClick={() => router.push("/sessions/new")}>
        {t("sessions.new")}
      </Button>
      {!loading && <SessionList sessions={sessions} onOpen={(id) => router.push(`/sessions/${id}`)} />}
    </main>
  );
}

export default function SessionsPage() {
  return (
    <AuthGuard>
      <SessionsInner />
    </AuthGuard>
  );
}
```

Create `app/(app)/sessions/new/page.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionForm } from "@/components/sessions/SessionForm";

function NewInner() {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { create } = useSessions(user?.uid ?? null);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">{t("session.create.title")}</h1>
      <SessionForm
        onCancel={() => router.push("/sessions")}
        onSubmit={async (values) => {
          await create({ ...values, adminId: user!.uid });
          router.push("/sessions");
        }}
      />
    </main>
  );
}

export default function NewSessionPage() {
  return (
    <AuthGuard>
      <NewInner />
    </AuthGuard>
  );
}
```

Create `app/(app)/sessions/[id]/page.tsx`:
```tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSessions } from "@/lib/data/use-sessions";
import { SessionForm } from "@/components/sessions/SessionForm";
import { DeleteConfirm } from "@/components/sessions/DeleteConfirm";
import { Button } from "@/components/ui/Button";
import type { Session } from "@/lib/types";

function DetailInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const { sessions, loading, update, remove } = useSessions(user?.uid ?? null);
  const [confirming, setConfirming] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(sessions.find((s) => s.id === id) ?? null);
  }, [sessions, id]);

  if (loading) return null;
  if (!session) return <p className="p-4">{t("common.back")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">{t("session.edit.title")}</h1>
      <SessionForm
        mode="edit"
        initial={{ name: session.name, mode: session.mode, defaultTaxRate: session.defaultTaxRate }}
        onCancel={() => router.push("/sessions")}
        onSubmit={async (values) => {
          await update(session.id, { name: values.name, defaultTaxRate: values.defaultTaxRate });
          router.push("/sessions");
        }}
      />
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => update(session.id, { status: session.status === "active" ? "closed" : "active" })}
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
            await remove(session.id);
            router.push("/sessions");
          }}
        />
      )}
    </main>
  );
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <DetailInner id={id} />
    </AuthGuard>
  );
}
```

- [ ] **Step 5: Run the full gate**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm test`
Expected: all suites pass.
Run: `npm run dev`, then in the browser: land on `/login`, sign in with Google (mock), get redirected to `/sessions`, create an "equal" session, see it listed, open it, confirm the mode picker is gone and the lock note shows, close it (badge flips), delete it (confirm modal), toggle language (labels switch ID↔EN), refresh the page and confirm sign-in + remaining sessions persist. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire login, session routes, auth guard, and root providers"
```

---

## Self-Review Notes

- **Spec coverage:** consolidation (Task 1), scaffold (Task 2), mock auth incl. Google + Email/Password and route guard (Tasks 5, 9, 13 / FR-1.1, FR-1.2, FR-1.4), session create with locked mode (Tasks 6, 11 / FR-2.1, FR-2.2), list filtered by admin (Tasks 6, 10, 13 / FR-2.3), edit name + status + delete (Tasks 11, 12, 13 / FR-2.4), `defaultTaxRate` default 11 (Tasks 6, 11 / FR-2.5), `shareToken` on create (Task 6), bilingual no-hardcoded-strings (Task 7, used throughout), `formatIDR` for reuse (Task 4), mobile-first shell (Task 13). FR-1.3 (admin sees only own sessions) is enforced by `listByAdmin` (Task 6) + `useSessions(user.uid)` (Tasks 10, 13).
- **Out of scope, intentionally:** members CRUD, payment info, restaurants/items, calc engine, export, share page, PWA, OCR, real Firebase — all later phases per the spec.
- **Type consistency:** `Session`, `User`, `NewSessionInput`, `PaymentInfo` (Task 3) are reused unchanged in Tasks 5, 6, 10–13. `SessionFormValues` (Task 11) carries `{ name, mode, defaultTaxRate }`; the create page maps it to `NewSessionInput` by adding `adminId`. Repository method names (`listByAdmin`, `get`, `create`, `update`, `delete`) are identical across interface (Task 6) and hook (Task 10). Auth method names (`signInWithGoogle`, `signInWithEmail`, `signOut`, `onAuthChange`) are identical across interface (Task 5) and provider (Task 9); the provider re-exposes them as `signInGoogle` / `signInEmail` and the UI uses those consistently.
- **Known follow-up for phase 1B+:** wiring the real Firebase implementation into the `getAuthProvider` / `getSessionRepo` factories; until then `NEXT_PUBLIC_BACKEND` stays `mock`.
