# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**SplitBro** — mobile-first PWA for splitting bills across multi-day, multi-restaurant trips. Two split modes: **Equal Split** (whole restaurant bill divided evenly) and **Item-Based Split** (each person pays for what they ordered). Driven by a Business Analyst (not a developer) via Claude Code — briefly explain technical decisions when relevant, and surface trade-offs rather than silently picking an architecture.

## Current state (read first)

The repo is **not scaffolded yet** — there is no `package.json`, no `app/`, no source code. What exists today is a Claude Code starter kit: the PRD, modular rules, and phased implementation prompts. The authoritative spec/rule files live at the repo root:

```
docs/PRD_SplitBro.md          ← full spec (single source of truth)
.claude/rules/
  ├── calculation-engine.md   ← exact calc algorithm — implement verbatim
  ├── firestore-schema.md     ← data model
  └── conventions.md          ← naming, folders, i18n, currency
prompts/                      ← phase prompts 1A → 1E, run in order
```

`Docs/*.xlsx` at the repo root are the real-world reference bills (Kediri = equal mode, Gempol = item mode) the calculation logic was derived from.

**Before implementing any feature, read `docs/PRD_SplitBro.md` and the relevant rule file.** Do not invent requirements that aren't in the PRD — if unsure, ask.

## Tech stack (fixed — do not swap without approval)

Next.js (App Router) + TypeScript (strict) + Tailwind · Firestore (NoSQL) · Firebase Auth (Google + Email/Password) · Tesseract.js (client-side OCR) · SheetJS `xlsx` (Excel export) + pdfmake (PDF export) · PWA via next-pwa/Workbox · deploy Vercel or Firebase Hosting. Everything must stay on **free tier** (Firestore Spark, Vercel Hobby) — avoid heavy deps and read/write-heavy Firestore patterns.

## Commands

The project isn't scaffolded, so no build tooling exists yet. Once phase 1A creates the Next.js app, the standard scripts apply: `npm run dev` (local), `npm run build`, `npm run lint`, and **`npx tsc --noEmit` for the type check that must pass after every code change**. Firebase config comes from `.env.local` (copy from `.env.example` at the repo root, fill `NEXT_PUBLIC_FIREBASE_*`). Do not assume these exist until you've confirmed `package.json` is present.

## Non-negotiable invariants

These hold across the whole app — violating any of them is a bug:

- **Admin-only login.** Only the Admin/Host authenticates. Members are manual data (name required; email/phone optional), never account holders. Firestore writes gated on `request.auth.uid == adminId`; public report access goes through a server route validating `shareToken`, never direct public Firestore reads.
- **1 session = 1 mode.** Mode (`equal` | `item_based`) is chosen at session creation and locked. Never build any mixed-mode feature.
- **No hardcoded UI strings.** All text flows through the i18n layer (ID + EN, user-switchable, persisted to localStorage). Keys are descriptive (`session.create.title`, not `text1`).
- **IDR, no decimals.** All amounts are plain `number`. Rounding (`Math.round` to nearest rupiah) happens **only at display/export**, never in intermediate calculation, to avoid accumulated error. Format via one shared `formatIDR()` helper → `"Rp 1.486.400"`.
- **Calculation logic must be a pure function**, separated from UI, with unit tests for both modes + shared cost + deposit (under/over payment) scenarios.

## Calculation engine (the heart of the app)

A wrong total is a critical bug — implement `.claude/rules/calculation-engine.md` exactly. Core flow:

1. **PPN/tax normalization per restaurant.** `applyTax(base, r)` returns `base` if `taxIncluded`, else `base * (1 + taxRate/100)`. For equal mode `base = restaurant.totalAmount`; for item mode `base = Σ item prices` (tax applied to the subtotal, then distributed proportionally to each member's consumption).
2. **Equal mode:** `effectiveTotal / N` added to every member's consumption, per restaurant.
3. **Item mode:** each item's price splits evenly across its `assignedTo` members (`rawShare`); then a per-restaurant `taxMultiplier = effectiveTotal / subtotal` scales each member's `rawShare` — so heavier orderers carry proportionally more PPN, not an even tax split.
4. **Shared costs** (driver, parking, etc.) always divide evenly across all members, in **both** modes.
5. **Settlement:** `netDue = consumption + sharedShare − deposit`. `>0` member still owes; `<0` member is refunded; `0` settled. Settlement is standardized to this straight formula even though the original Kediri Excel had a non-standard "Saldo Akhir" formula.

## Data model

Hierarchy: `users/{uid}` → `sessions/{id}` (embeds `members[]`, `paymentInfo`, `mode`, `shareToken`, `defaultTaxRate`) → subcollections `restaurants/{id}` → `items/{id}` (item mode only) and `sharedCosts/{id}`. Members are embedded in the session doc (typically <20, safe under the 1 MB limit) so one read yields everything needed to calculate; updating a member rewrites the session doc, so use a transaction where races are possible. Full shapes in `.claude/rules/firestore-schema.md` — **don't change a document shape without updating that file AND the PRD.** Mirror the schema as TypeScript types in `lib/types.ts`.

## Workflow

Work phase by phase (`prompts/` 1A → 1E); finish and type-check one phase before the next. Make **minimal changes** — don't refactor code you weren't asked to touch. Run the type check after every code change. When two approaches exist, explain both and let the user choose.
