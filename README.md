# The Unsealed Revelation

> A calm, reverent, collaborative place where anyone, from any tradition, can help
> gather the book of Revelation into its plain, pure, and precious form — filtering
> every word through love. **theword.love**

Nothing is final. The gathering is the work.

---

## What this is

The book is organized as **Movements → Passages**, each Passage mapped to a
canonical Revelation reference. Each Passage holds many **Renderings** side by side
(never ranked), one promoted **Gathered Rendering**, and the **Tenets** (filtering
principles) each rendering applied. People will express **Resonance** (additive
only — no downvotes) and leave gentle **Reflections**.

This repo currently delivers **Milestone 1**: the reverent base, the data model,
the mission page, and the reader — seeded with real content.

## Milestone 1 — what's built

- **Reverent design system** — warm parchment palette, EB Garamond serif body,
  generous whitespace, mobile-first, WCAG-minded (skip link, visible focus,
  semantic HTML, reduced-motion support).
- **Mission / landing page** (`/`) — the invitation, with warm calls to action.
- **The reader**
  - `/read` — the gathered book by Movement → Passage.
  - `/read/[movement]/[passage]` — the Gathered Rendering set large and luminous,
    the traditional KJV text available alongside, all alternative renderings held
    side by side with their tenets, and gentle next/previous navigation.
- **Two seed renderings, side by side.** Both tellings in `/content` are mapped
  onto one shared set of canonical passages:
  - `the-unsealed-revelation.md` — the fuller telling (seeded as the initial
    Gathered Rendering).
  - `the-unsealed-revelation-vision.md` — "A Vision," the plainer telling, held
    beside it. ~20 of 22 passages show both; the shared canonical reference is
    what lets them sit together.
- **Founding tenets** — all 21 founding filters parsed from the seed library and
  linked to the passages they read through.
- **Supabase schema + RLS** (`supabase/migrations/0001_init.sql`) — the full data
  model with row-level security: reading is open to all, contributing needs an
  account, gathering and moderation belong to stewards.
- **Idempotent seed script** (`npm run seed`) — pushes movements, passages, both
  renderings, tenets, and gathered history into Supabase.

> **How content is served today:** the reader reads the in-repo seed content
> directly, so it runs beautifully with no credentials. The Supabase schema and
> seed script are ready; moving reads onto Supabase happens in M2 alongside
> accounts and authoring (the data-access layer in `src/lib/data` is the single
> seam where that swap happens).

## Decisions made (the spec's recommended defaults)

These were the spec's open questions; I proceeded with its recommendations — all
easily revisited:

- **Open reading; sign-in only to contribute** (auth arrives in M2).
- **Stewards: invite-only at first** (M3).
- **"Gather in prayer": a quiet Phase 2 space.**
- **License: CC BY-SA 4.0** so the gathered Word stays free.
- **English-only MVP with an i18n-ready data model.**
- **Initial Gathered Rendering = the fuller telling**, with "A Vision" beside it —
  a gentle, revisable steward choice, never a ranking.

## Run it

```bash
npm install
npm run dev
# http://localhost:3000
```

No environment variables are needed to read the seeded book.

## Connect Supabase (optional for M1, needed from M2)

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; used by the seed script)
3. Run the schema migration in the Supabase SQL editor (or via the Supabase CLI):
   `supabase/migrations/0001_init.sql`
4. Seed it:
   ```bash
   npm run seed
   ```

`.env.local` is gitignored — never commit keys.

## Project structure

```
content/                         the seed renderings + mission text
docs/                            product spec, build kickoff, seed tenets
supabase/migrations/             schema + RLS
scripts/seed.ts                  idempotent Supabase seeder
src/
  app/
    page.tsx                     mission / landing
    read/                        the reader (index + passage view)
  components/                    header, footer, prose, rendering, tenets
  lib/
    types.ts                     domain model
    content/parse.ts             markdown → sections / tenets
    content/seed.ts              maps both tellings onto canonical passages
    data/                        data-access layer (reader's only source)
    supabase.ts                  Supabase client helpers
```

## What's next (suggested milestone order)

- **M2** — accounts (email magic link) + submit a rendering + tenets library +
  resonance + reflections. Move reads onto Supabase.
- **M3** — stewardship: promote Gathered Renderings with history, flagging,
  guidelines.
- **M4** — inline suggestions, version-history UI with diffs, search.
- **M5** — translation layer and the quiet prayer space.

---

*Bring your own rendering. Bring the tenets you filter it through. Whatever helps
love and truth come through more clearly belongs here.*
