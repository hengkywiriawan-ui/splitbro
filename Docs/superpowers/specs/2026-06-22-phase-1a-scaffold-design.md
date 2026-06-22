# Phase 1A — Scaffold, Mock Auth & Session Management (Design)

**Date:** 2026-06-22
**Status:** Approved design, pre-implementation
**Source spec:** `docs/PRD_SplitBro.md` (sections 2, 3, FR-1, FR-2), `.claude/rules/*`

## Context

SplitBro is a mobile-first PWA for splitting multi-day, multi-restaurant trip bills (Equal Split + Item-Based Split). The repo currently holds only a Claude Code starter kit (PRD, rules, phase prompts) — no application code is scaffolded.

This design covers the **first build slice**: Phase 1A (project scaffold + Admin auth + session management), with two scoping decisions made during brainstorming:

1. **Project root** — consolidate the nested starter files to the repo root, then scaffold the Next.js app at root.
2. **Defer Firebase** — build with a mock, localStorage-backed auth + data layer behind interfaces, so the UI is usable immediately without Firebase setup. Real Firebase drops into the same interfaces in a later step with no UI changes.

## Goals

- A running, mobile-first Next.js app the user (a Business Analyst, not a developer) can click through.
- Admin can "log in" (mocked), create sessions with a locked mode, list/edit/close/delete them — matching FR-2.
- A clean data/auth abstraction seam so swapping mock → Firebase later is a localized change.
- Bilingual UI (ID + EN) with zero hardcoded strings.

## Non-Goals (later phases)

Members, restaurants, items, calculation engine, shared costs, settlement, Excel/PDF export, share link, PWA install, OCR, and real Firebase wiring are all out of scope for this slice.

## Scope of this slice

- **Consolidate**: move `docs/`, `.claude/rules/`, `prompts/` from `files/splitbro_claude_code_starter/splitbro/` to the repo root. The root `CLAUDE.md` already exists (written during `/init`); update its relative paths to point at the new root locations, then delete the now-duplicate nested `CLAUDE.md` and starter `README.md`. Leave `Docs/*.xlsx` (reference bills) in place.
- **Scaffold**: Next.js (App Router) + TypeScript (strict) + Tailwind CSS at the repo root.
- **Mock auth**: login screen (Google + Email/Password buttons) backed by a mock provider that returns a fake admin user persisted to localStorage; logout; route guard redirecting unauthenticated users to `/login`.
- **Session management (FR-2)**: create (name + mode picker, mode locked after create), list filtered by admin, edit name, toggle status active/closed, delete with confirmation, `defaultTaxRate` (default 11), generate unique `shareToken` on create.
- **i18n**: simple ID + EN dictionary, language toggle, persisted to localStorage, default `id`.
- **Mobile-first** layout shell.

## Architecture

Folder layout extends `.claude/rules/conventions.md` with a data/auth seam:

```
app/
  (auth)/login/page.tsx
  (app)/sessions/page.tsx          # list
  (app)/sessions/new/page.tsx      # create
  (app)/sessions/[id]/page.tsx     # detail / edit
  layout.tsx
components/
  ui/                              # Button, Input, Card, Badge, Toast, LangToggle
  auth/                            # LoginForm, AuthGuard
  sessions/                        # SessionList, SessionForm, ModePicker, DeleteConfirm
lib/
  auth/
    types.ts                       # AuthProvider interface, User type
    mock-auth.ts                   # localStorage mock implementation
    provider.tsx                   # React context + useAuth() hook
  data/
    types.ts                       # SessionRepository interface, NewSessionInput
    mock-repo.ts                   # localStorage implementation
    index.ts                       # factory: select mock | firebase by env flag
  firebase/                        # empty stub now; real impl in a later step
  i18n/
    dictionaries.ts                # { id: {...}, en: {...} }
    provider.tsx                   # context + useT() hook + LangToggle wiring
  calc/                            # placeholder; calculation engine lands in phase 1C
  types.ts                         # shared domain types (User, Session, Member, ...)
  format.ts                        # formatIDR
```

This introduces `lib/data/` and `lib/auth/` beyond `conventions.md`'s `lib/firebase/`. That is the intentional abstraction seam; the Firebase implementation will live under `lib/firebase/` and be wired into the `lib/data` factory.

### The seam — two interfaces

```ts
interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
}

interface SessionRepository {
  listByAdmin(adminId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
  create(input: NewSessionInput): Promise<Session>;
  update(id: string, patch: Partial<Session>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

A factory in `lib/data/index.ts` (and the auth equivalent) selects the implementation from `NEXT_PUBLIC_BACKEND=mock|firebase`, defaulting to `mock`. UI code calls only the `useAuth()` / `useSessions()` hooks and never imports a concrete implementation. Swapping to Firebase later means adding the Firebase implementation and flipping the flag — no UI changes.

## Components & data flow

Components:
- `auth/LoginForm` — Google button + email/password fields. `auth/AuthGuard` wraps the `(app)` route group and redirects when there is no user.
- `sessions/SessionList` — cards showing name, mode badge, status; tap opens detail. Empty state prompts creating the first session.
- `sessions/SessionForm` — create mode shows name + `ModePicker`; edit mode shows name + status only, with the mode field hidden/disabled (locked).
- `sessions/ModePicker` — two-card selector explaining each mode, bilingual.
- `sessions/DeleteConfirm` — confirmation modal before delete.
- `ui/` — Button, Input, Card, Badge, Toast, LangToggle.

Data flow:

```
UI component
  -> useAuth() / useSessions() hooks (React context)
    -> AuthProvider / SessionRepository interface
      -> mock implementation (localStorage read/write)
  -> state update -> re-render
```

The mock re-reads localStorage after each write to simulate a fetch. The later Firestore implementation swaps in a real-time listener behind the same hook surface, with no UI change.

## i18n & currency

- `dictionaries.ts` holds `{ id, en }` with descriptive keys (e.g. `session.create.title`). A `useT()` hook resolves keys; `<LangToggle>` switches language. Language persists to localStorage, default `id`. Every visible string goes through `t()`.
- `formatIDR(n)` returns e.g. `"Rp 1.486.400"` (locale id, no decimals). Internal values are always `number`. It is barely exercised this slice (no amounts yet) but is built and tested now for reuse in later phases.

## Error handling & validation

- Create validation: name required, mode required.
- Async errors surface as an inline Toast via i18n keys.
- Route guard redirects unauthenticated users to `/login`.
- Mode lock is enforced in two places: the UI disables/hides the mode field on edit, and the repository's `update` ignores any `mode` field in the patch.

## Testing

- **Vitest** for pure logic and the mock repository.
- Mock repo tests: create/list/update/delete; `listByAdmin` filters by admin; mode is immutable on update; `shareToken` is generated and unique; `defaultTaxRate` defaults to 11.
- `formatIDR` tests: rounding to nearest rupiah, thousands separator.
- `SessionForm` validation: name and mode required on create.
- The calculation engine and its tests are deferred to phase 1C (no calculation logic in this slice).
- Done-gate: `npx tsc --noEmit` clean and `vitest run` green.

## Open items / assumptions

- Mock data persists in localStorage, so sessions survive page refresh (better demo feel). Cleared by clearing browser storage.
- No git repository exists yet. Initializing git and committing is a separate decision for the user; this design document is written to disk regardless.
- Firebase project creation, auth provider enablement, and `.env.local` population happen in a later slice when wiring the real backend.
