# Build Kickoff — The Unsealed Revelation

*Paste this into Claude Code to begin. It sets the context, the values, the stack, and a bounded first milestone so the first session ships something real.*

---

## Paste this into Claude Code

> I'm building a web platform called **The Unsealed Revelation**: a calm, reverent, collaborative space where anyone, from any tradition, can help gather and refine the book of Revelation into a plain, pure, and loving rendering — and share the "tenets" (filtering principles) they read it through. The full product spec is in `unsealed-revelation-product-spec.md` and the founding tenets are in `unsealed-revelation-seed-tenets.md`. Read both before writing code.
>
> **Core idea:** the book is organized as **Movements → Passages** (each Passage mapped to a canonical Revelation reference). Each Passage holds many **Renderings** side by side (never ranked), one promoted **Gathered Rendering**, and the **Tenets** each rendering applied. People express **Resonance** ("this resonates," additive only — no downvotes) and leave gentle **Reflections** (comments). Tenets are their own collaborative library.
>
> **Values that must shape the build (non-negotiable):**
> - Gathering, not competing. No leaderboards, no downvotes, no "winning" renderings. Renderings sit side by side.
> - Reverent, warm, luminous, uncluttered. Reading should feel like scripture, not an app: generous whitespace, beautiful serif body type, calm palette, mobile-first.
> - Radically accessible and gentle. Microcopy is inviting ("Offer a rendering," "Add your light"), never competitive. WCAG-minded.
> - Nothing is final: version history on renderings, gathered renderings, and tenets.
> - No finger-pointing: the platform refuses content that targets or dehumanizes any people, group, or tradition.
>
> **Stack:** Next.js (App Router, TypeScript) + Tailwind CSS + Supabase (Postgres + email magic-link auth + row-level security). Deploy target: Vercel + Supabase. Keep it a single Next.js app — no premature microservices.
>
> **Milestone 1 (do this first, end to end, before anything else):**
> 1. Scaffold the Next.js + Tailwind + Supabase app with a clean, reverent base layout and typography.
> 2. Define and migrate the database schema for: `users`, `movements`, `passages`, `renderings`, `rendering_versions`, `tenets`, `rendering_tenets`, `resonances`, `reflections` (see the spec's data model section for fields).
> 3. Build the **mission/landing page** (`/`) — I'll paste in the invitation text; treat it as the hero, with a warm call to action.
> 4. Build the **reader**: `/read` (list Movements → Passages) and `/read/[movement]/[passage]` (show the Gathered Rendering beautifully, with the traditional/public-domain text available alongside, and all alternative renderings listed below with their tenets and resonance counts).
> 5. Add a seed script that imports starter content (I'll provide the rendered book and the seed tenets file).
>
> Stop after Milestone 1 so I can review before we add authoring, tenets pages, resonance, reflections, and stewardship. Ask me any clarifying questions about data shape or seed format before you start coding, then propose a file/folder structure and the schema, and wait for my OK.

---

## Notes for you (the owner), not for Claude Code

- **Before pasting:** drop these three files into the project repo so Claude Code can read them — `unsealed-revelation-product-spec.md`, `unsealed-revelation-seed-tenets.md`, and your full rendered book (for seeding). Also paste your mission/invitation text into the landing page when asked.
- **Decide up front** (the spec's open-questions list): open reading vs. sign-in to read (recommend open reading, sign-in only to contribute); how stewards are chosen; whether "gather in prayer" is core or a quiet Phase 2; and a contribution license (recommend CC BY-SA so the gathered Word stays free).
- **Suggested milestone order after M1:** (M2) accounts + submit a rendering + tenets library + resonance + reflections; (M3) stewardship — promote Gathered Renderings with history, plus flagging and guidelines; (M4) inline suggestions, version-history UI with diffs, search; (M5) translation layer and the prayer space.
- **Keep Claude Code on a short leash per session** — one milestone at a time, review between. It builds better in bounded steps than "build the whole thing."
