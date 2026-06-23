# SplitBro Full Redesign Design

Date: 2026-06-23
Status: Ready for user review

## Summary

Redesign all existing SplitBro app screens using the `Docs/design` references and the `Docs/design/heritage_excellence/DESIGN.md` design system as the source of truth. The redesign will be reference-faithful: deep navy structure, gold premium accents, red only for destructive or critical actions, Hanken Grotesk UI typography, JetBrains Mono currency typography, tonal surfaces, thin borders, and mobile-first responsive layouts that expand into desktop bento/table compositions where useful.

This is a visual and interaction redesign only. It must not change settlement math, Firestore schema, authentication rules, route structure, session mode rules, or i18n requirements.

## Chosen direction

### Purpose

SplitBro helps an admin/host manage trip bill splitting across sessions, members, restaurants, shared costs, payments, and settlement reports. The UI must support repeated data entry on mobile while keeping totals and status easy to scan.

### Audience

Primary user is the admin/host, often entering bills during or after a trip. They need quick confidence: which session is active, what data is missing, how many people/restaurants/costs are recorded, and who owes or gets refunded.

### Tone

Strict Heritage Excellence: premium, structured, reliable, and professional. The app should feel like a trusted ledger for trip money, not a playful bill-splitting toy.

### Memorable detail

Premium ledger treatment: important summary cards use deep navy surfaces with gold accents or thin gold top borders; all money uses tabular mono numerals so totals align and feel accountable.

## Constraints

- Keep Next.js App Router and existing route structure.
- Keep TypeScript strict patterns.
- Keep all UI copy through existing i18n dictionaries. No hardcoded user-facing text.
- Keep IDR formatting through shared money helpers/components.
- Keep mobile-first PWA behavior.
- Keep free-tier-friendly dependency profile. No new design dependency unless required; this plan does not require one.
- Preserve calculation engine behavior: display rounding only, no intermediate rounding changes.
- Preserve admin-only write model and public share route behavior.

## Design system

### Color tokens

Adopt Heritage Excellence colors in `app/globals.css` Tailwind theme variables:

- Primary navy: `#001e40` for headings, important structure, and premium dark surfaces.
- Primary container: `#003366` for app bars, primary panels, and selected states.
- Gold accent: `#cca830` / `#e9c349` for premium CTAs, summary accents, and highlighted totals.
- Red accent: `#bb0027` / `#e0283c` for destructive actions and critical statuses only.
- Background: `#f8f9fa`.
- Card: `#ffffff`.
- Surface gray layers: `#f3f4f5`, `#edeeef`, `#e7e8e9`, `#e1e3e4`.
- Text: `#191c1d`.
- Muted text: `#43474f`.
- Border: `#c3c6d1` or lighter subtle border where density needs restraint.

### Typography

- Hanken Grotesk remains primary UI font.
- JetBrains Mono remains currency font.
- Headings use navy and weights 600–700.
- Labels use uppercase letter-spaced style via existing `.label-caps`.
- Money uses `.font-num` with tabular numerals.

### Shape and depth

- Buttons and inputs: 4–8px radius.
- Cards and containers: 8–12px radius.
- Prefer 1px borders and tonal backgrounds over heavy shadows.
- Use soft shadow only for floating action buttons, modal-like actions, and important dark hero cards.

## Core component changes

### Button

Variants:

- `primary`: gold background with navy text for main CTA on a screen.
- `secondary`: navy background with white text for standard primary actions.
- `outline`: white/card background with navy border/text.
- `ghost`: transparent navy text, subtle hover background.
- `danger`: red background with white text.

Buttons keep minimum touch target of 48px and clear disabled state.

### Card

Cards become document-like surfaces:

- White background.
- Thin outline.
- Optional `featured` treatment with gold top border.
- Optional dark premium variant for hero totals.
- No nested-card visual clutter.

### Input

Inputs use uppercase labels above fields, light surface background, 1px border, navy focus ring/border, and clear helper/error text. Existing forms should remain functional but receive consistent spacing and field grouping.

### Badge

Badges use semantic Heritage tones:

- Active/open: navy or green if already present in domain semantics.
- Closed/neutral: gray.
- Mode chips: light navy tint.
- Pending/warning: gold tint.
- Destructive/error: red tint.

### PageHeader

Use sticky top app bar pattern:

- Back action on detail pages.
- Navy title.
- Optional right action.
- Light translucent background by default.
- Main sessions dashboard may use solid navy brand bar, matching design references.

### Money

Money remains a shared component. It should enforce mono/tabular numerals and Heritage tones:

- Default/primary: navy.
- Owe: red or navy depending context; red reserved for problem states, so ordinary “must pay” can use navy.
- Refund: gold/tertiary or success if current semantics require positive outcome.
- Muted: muted text.

## Screen redesign

### Sessions dashboard (`/sessions`)

Reference: `Docs/design/dashboard_splitbro`.

- Solid navy top app bar with SplitBro title, language toggle, and logout action.
- Top summary card showing active sessions and key state available from current data. If total outstanding is not yet available without extra reads, show session count/member count instead to avoid expensive Firestore reads.
- Session list cards use status chip, mode chip, session name, member avatar stack, member count, and primary “view details” action semantics through card click.
- Empty state uses `Docs/design/empty_state_splitbro`: centered icon-like panel, concise message, gold CTA.
- Floating action button becomes gold premium CTA.

### New/edit session form (`/sessions/new`, session hub edit area)

- Form appears as premium bordered panel.
- Mode picker appears as two structured cards with selected navy/gold state.
- Default tax rate input uses ledger-style label and helper text.
- Submit button uses gold primary CTA.

### Session hub (`/sessions/[id]`)

Reference: dashboard and summary patterns.

- Sticky top header with back link, session name, status chip.
- Hero summary card with mode, default PPN, members count, restaurants count, shared costs count.
- Quick action rail/grid: Members, Payment, Restaurants, Shared Costs, Summary.
- Each quick action card has a consistent icon treatment via existing inline SVG/text glyph patterns, count/status, and chevron.
- Summary CTA uses gold.
- Close/reopen and delete remain separate lower danger/secondary controls.
- Keep session edit form but visually contained below hero or in a settings panel.

### Members (`/sessions/[id]/members`)

Reference: `Docs/design/members_splitbro`.

- Header: back, title, optional count chip.
- Add member form in bordered panel with strong field label and gold submit.
- Member rows become ledger rows: avatar initials, name, optional email/phone, deposit amount aligned right in mono.
- Edit/delete actions use compact outline/ghost controls; delete confirmation uses red danger button.
- Empty state directs user to add first member.

### Restaurants (`/sessions/[id]/restaurants`)

Reference: `Docs/design/restaurants_splitbro`.

- Header with count and add restaurant CTA.
- Restaurant cards show name, date if present, tax status, tax rate, total amount for equal mode, and item count affordance where available.
- Equal mode emphasizes total amount input/status.
- Item-based mode emphasizes entering items per restaurant.
- Desktop can use two-column card grid; mobile stays single column.

### Restaurant items (`/sessions/[id]/restaurants/[restaurantId]`)

Reference: `Docs/design/add_expense_splitbro`.

- Header includes restaurant name and back to restaurants.
- Add item form becomes primary panel.
- Item rows show item name, price in mono, assignee chips/avatars, and edit/delete controls.
- Multi-assignee display must remain clear on narrow mobile screens by wrapping chips.
- If no members exist, show blocking empty state telling user to add members first.

### Shared costs (`/sessions/[id]/shared-costs`)

Reference: `Docs/design/shared_costs_splitbro`.

- Summary card shows total shared pool and per-member share when member count > 0.
- Mobile shows shared costs as cards; desktop can show table-like layout with category/name and amount aligned right.
- Add shared cost CTA uses gold.
- Delete remains red danger.

### Payment info (`/sessions/[id]/payment`)

Reference: `Docs/design/payment_info_splitbro`.

- Payment details form grouped as account, e-wallet, and note fields.
- Use labeled inputs with professional form rhythm.
- Save CTA gold.
- Empty optional fields should not look broken; show muted helper text.

### Summary/export (`/sessions/[id]/summary`)

Reference: `Docs/design/session_summary_splitbro`.

- Grand total hero uses navy surface and gold accent.
- Deposit and balance appear as two compact ledger stats.
- Member settlement rows use avatar, name, net status label, amount aligned right.
- Expanded row uses bordered breakdown section with consumption, shared share, total, deposit.
- Export buttons use grouped controls: Excel/PDF primary/secondary styling, share link as outline/ghost depending risk.
- Preserve rounding note behavior if present.

### Public share page (`/share/[token]`)

Apply the same summary styling as the admin summary page, but remove admin-only controls. Keep the read-only report clear and trustable.

## Layout rules

### Mobile

- Max content width remains comfortable for phone use.
- Sticky headers where current page benefits from orientation.
- Main actions appear near bottom via gold CTA/FAB only where not conflicting with forms.
- Cards stack vertically, 12–16px gap.
- Money aligns right when paired with labels.

### Desktop/tablet

- Use wider max container where screens benefit from bento/table layout.
- Dashboard/session hub can expand to 2-column or 12-column bento.
- Lists with financial rows can become table-like while preserving same data.
- Forms remain readable, not stretched edge-to-edge.

## Data flow and behavior

- No data model changes.
- No new reads required for decorative totals unless data already loaded by page hooks.
- Session dashboard should not introduce expensive cross-subcollection aggregation.
- Existing handlers and hooks stay in place.
- Existing validation and save flows stay in place.
- Delete confirmations remain explicit.
- Loading/not-found states remain present and receive visual styling.

## Error handling

- Existing explicit error handling must be preserved.
- UI should show form errors/helper text in red/error tone where existing forms expose errors.
- Empty/blocking states should tell user what to do next without adding hidden behavior.

## Accessibility

- Keep 48px minimum tap targets for primary interactive controls.
- Maintain visible keyboard focus states.
- Maintain sufficient contrast for navy/gold/red combinations.
- Do not rely on color alone for statuses; keep text labels.
- Buttons and links must keep accessible names.
- Avatar initials are decorative unless conveying identity; visible names remain present.

## Testing and verification plan

Implementation should verify:

- `npx tsc --noEmit` passes after code changes.
- Existing unit tests pass where present.
- i18n keys cover new text.
- No hardcoded user-facing strings are introduced.
- Key flows remain usable: create session, open session hub, manage members, manage restaurants/items, manage shared costs, edit payment info, view summary/export controls.
- Mobile viewport and desktop viewport render without overflow.

## Implementation boundaries

In scope:

- `app/globals.css` design tokens.
- Existing UI primitives in `components/ui`.
- Existing app pages and domain components used by listed screens.
- Existing i18n dictionary additions if labels are needed.

Out of scope:

- New route structure.
- Bottom navigation.
- Firestore schema changes.
- Calculation engine changes.
- Auth model changes.
- New design library dependency.
- OCR/PWA service worker changes unless current UI edit directly touches their screens.

## Open decisions resolved

- Redesign scope: full screen redesign.
- Design system: strict Heritage Excellence.
- Responsiveness: mobile-first plus desktop/tablet responsive layouts.
- Navigation: hybrid top app bar plus session quick action rail; no persistent bottom nav.
- Implementation approach: reference-faithful responsive rebuild.
