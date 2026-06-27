# Product Spec — The Unsealed Revelation (Collaborative Web Platform)

*A platform where anyone, from any tradition, can help gather and refine the book of Revelation into its plain, pure, and precious form — filtering every word through love until the scattered Word of God is gathered into one place.*

---

## 1. Vision & Purpose

Revelation was never meant to stay sealed; its own last pages ask that it be left open. This platform exists to open it — not through one scholar or one church, but the way the pure Word of God has always been recovered: by the desire of His children, gathered together, filtering every word through love.

The product gathers, in one place, the community's evolving plain-language rendering of Revelation, the **tenets** (filtering principles) used to purify it, and the many hands that refine it over time. The goal is not to win an argument about Revelation. It is to gather its true meaning into one place so that the scattered human family might gather with it.

The platform is **collaborative, multi-tradition, non-adversarial, and never finished.** Nothing is final; every offering is held gently, weighed against love, and passed to the next set of hands.

---

## 2. Guiding Principles (these shape every product decision)

1. **Gathering, not competing.** The UI must never feel like a debate or a leaderboard. Favor "this resonates" over up/down voting; favor merging over winning; favor "alternative renderings held side by side" over one rendering defeating another.
2. **Love is the filter.** Everything is tested against the two great commandments — love of God, and love of neighbor as oneself. This is encoded in the tenets and in the community guidelines.
3. **Radically accessible.** Plain language, gentle tone, low barrier to entry. A newcomer with desire and no theological training should be able to contribute meaningfully in five minutes.
4. **Many tongues, many traditions, one family.** Designed from day one to hold multiple languages and traditions side by side, honoring difference while gathering toward unity.
5. **Nothing is final.** Full version history everywhere. Every rendering, every tenet, every gathered text can always be revisited and refined.
6. **No finger-pointing.** Consistent with the work itself, the platform refuses content that targets or dehumanizes any people, group, or tradition. The enemy is never a people.
7. **Desire qualifies.** Anyone who wishes to help belongs. Trust and stewardship are earned gently over time, not gatekept.

---

## 3. Core Concepts (glossary / domain model)

- **Passage** — A segment of Revelation (e.g., "Revelation 12:1–6"), the basic unit of collaboration. Has a canonical reference and may belong to a larger thematic **Movement**.
- **Movement** — An optional higher-level grouping (e.g., "The Mother," "The Throne and the Sealed Word") reflecting the reordered, love-ordered telling. A Movement gathers one or more Passages.
- **Rendering** — A purified, plain-language version of a Passage submitted by a contributor. Multiple renderings can exist per Passage. Each may cite the Tenets it applied, a language, and a tradition.
- **Gathered Rendering** — The community's current best/agreed rendering for a Passage (promoted from among the renderings, or a merged version). Has full version history.
- **Tenet** — A filtering principle used to purify the text (e.g., "Everything must hang on the two great commandments"; "Tares are lies, not people"; "Christ is the Word"). Tenets form a shared, evolving library. Renderings reference the tenets they used.
- **Resonance** — A gentle, additive affirmation a member can give to a rendering, tenet, or comment (a single positive signal — never a downvote).
- **Reflection** — A comment / discussion contribution attached to a Passage, Rendering, or Tenet.
- **Member** — Anyone participating. **Steward** — A trusted member who can promote Gathered Renderings and help moderate. **Owner/Admin** — Manages stewards and settings.

---

## 4. Primary Personas

- **The Seeker** — Arrives via the mission statement; curious, may not contribute at first. Needs an inviting, readable entry into the gathered text.
- **The Contributor** — Wants to submit their own rendering of a passage and the tenets they filter through.
- **The Refiner** — Reads existing renderings, suggests improvements, expresses resonance, discusses.
- **The Translator / Tradition-bearer** — Brings another language or another tradition's wisdom.
- **The Steward** — Tends the work: merges, promotes gathered renderings, keeps the culture loving, handles flags.

---

## 5. Core Features

### MVP (build this first)

1. **Read the gathered text.** Browse Revelation by Movement → Passage. Each Passage shows the current **Gathered Rendering** in clean, beautiful, readable typography, with the traditional (public-domain, e.g. KJV) text available alongside for grounding.
2. **Submit a Rendering.** A logged-in member can submit a plain-language rendering for any Passage, selecting the Tenets they applied (from the library, or proposing a new one), and optionally a language and tradition tag.
3. **View alternative Renderings side by side.** All renderings for a Passage are viewable together, gently, without ranking — each with its tenets, author, language, tradition, and resonance count.
4. **Tenets library.** Browse, read, and submit Tenets. Each Tenet has a name, plain description, supporting scripture and/or cross-cultural wisdom, resonance, and discussion. Renderings link to the tenets they used.
5. **Resonance.** One-tap "this resonates" on renderings, tenets, and reflections. Additive only.
6. **Reflections (discussion).** Threaded, gentle comments on Passages, Renderings, and Tenets.
7. **Accounts & profiles.** Simple sign-up (email magic link). Lightweight profile: name/handle, optional tradition, optional languages, a short "why I'm here." A member's renderings can be viewed together as their personal rendering of the book.
8. **Stewardship: promote a Gathered Rendering.** Stewards can set/replace the Gathered Rendering for a Passage (choosing a rendering or pasting a merged version), with full version history and an edit note.
9. **Mission / onboarding page.** The invitation text as the landing experience, with a clear, warm call to participate.
10. **Community guidelines + flagging.** Visible guidelines rooted in the two great commandments; any item can be flagged for steward review.

### Phase 2 (after MVP)

- **Inline suggestions / proposed edits** to a rendering (GitHub-PR-style, but gentle), with steward acceptance and history.
- **Version history UI** with diffs for Gathered Renderings and Tenets.
- **Translation layer** — link renderings across languages; show a passage in the reader's chosen language with others available.
- **Search** across renderings, tenets, and reflections.
- **Tradition / language filters and lenses** — read the whole book through a chosen tenet-set or tradition.
- **"Gather in prayer"** — an optional shared space: a prayer wall and/or periodic united-prayer moments around the work. Keep it quiet, optional, never gamified.
- **Notifications / digests** — gentle, opt-in.
- **Export** — the current Gathered Rendering as a clean document (Markdown/PDF/EPUB).

### Later / nice-to-have

- Side-by-side multi-language reading.
- Audio renderings / read-aloud.
- "Maps of resonance" visualizing where the community has converged.
- Public API for the gathered text.

---

## 6. Information Architecture (pages)

- `/` — Mission / invitation + entry into the reader.
- `/read` — The gathered book: list of Movements → Passages.
- `/read/[movement]/[passage]` — Passage view: Gathered Rendering, traditional text, all alternative renderings, tenets used, reflections.
- `/render/[passage]` — Submit / edit a rendering.
- `/tenets` — Tenets library.
- `/tenets/[id]` — Single tenet: description, support, renderings using it, discussion.
- `/members/[handle]` — A member's profile and their personal rendering of the book.
- `/guidelines` — Community guidelines.
- `/about` — Vision, how it works, FAQ.
- `/steward` — Steward dashboard (flags, promotions, history) — gated.
- Auth pages — sign in / sign up (magic link).

---

## 7. Key User Flows

1. **Newcomer reads, then joins.** Land on mission → "Read the gathering" → browse a Passage → moved by it → "Add your light" → magic-link sign-up → submit first rendering.
2. **Contributor submits a rendering.** Open Passage → "Offer a rendering" → write plain-language text → select tenets applied (or propose new) → set language/tradition → submit → appears among renderings.
3. **Refiner improves.** Read alternative renderings → leave a reflection or (Phase 2) propose an inline edit → express resonance.
4. **Steward gathers.** Review renderings + discussion for a Passage → promote one (or paste a merged version) as the Gathered Rendering with a note → history records the change.
5. **Tenet-bearer adds a filter.** Go to Tenets → "Offer a tenet" → name + plain description + supporting wisdom → community discusses and resonates → renderings begin to cite it.

---

## 8. Data Model (entities & key fields)

> Use a relational DB. Suggested core tables:

- **users**: id, handle, display_name, email, bio, traditions[], languages[], role (member|steward|admin), created_at.
- **movements**: id, title, slug, order_index, summary.
- **passages**: id, movement_id (nullable), canonical_ref (e.g. "Rev 12:1-6"), order_index, traditional_text, current_rendering_id (nullable).
- **renderings**: id, passage_id, author_id, body (markdown), language, tradition, status (draft|submitted|gathered|archived), created_at, updated_at.
- **rendering_versions**: id, rendering_id, body, edited_by, note, created_at. *(history)*
- **tenets**: id, title, slug, description, support (scriptural/cross-cultural), author_id, created_at.
- **tenet_versions**: id, tenet_id, description, support, edited_by, note, created_at.
- **rendering_tenets**: rendering_id, tenet_id. *(many-to-many)*
- **resonances**: id, user_id, target_type (rendering|tenet|reflection), target_id, created_at. *(unique per user+target)*
- **reflections**: id, author_id, target_type (passage|rendering|tenet), target_id, parent_id (nullable, for threads), body, created_at.
- **flags**: id, reporter_id, target_type, target_id, reason, status (open|resolved), created_at.
- **gathered_history**: id, passage_id, rendering_id (or inline body), promoted_by, note, created_at.

---

## 9. Collaboration & Refinement Mechanics

- The book is grounded in **canonical Revelation** (chapter:verse on every Passage) so contributors across traditions can always map to a shared reference, even as the love-ordered **Movements** present them in a healed order.
- Each Passage holds **many renderings at once, side by side** — difference is preserved, not flattened. There is always exactly one **Gathered Rendering** representing the community's current convergence.
- **Resonance** surfaces where the community is gathering, but never auto-promotes; a human **Steward** always makes the gathering act, keeping it relational rather than mechanical.
- **Everything is versioned.** No edit destroys what came before; the history is part of the record of the gathering.
- **Tenets are themselves collaborative artifacts** — the lens is refined alongside the text, because purifying the filter is part of purifying the Word.

---

## 10. Moderation, Safety & Community Guidelines

- **Guidelines** (short, visible, rooted in the two great commandments): contribute in love; assume good faith; no content that targets, dehumanizes, or excludes any people, group, or tradition; no harassment; keep it plain, pure, and precious; nothing is final, so hold opinions gently.
- **Flagging** on any item → steward queue. Stewards can hide pending review, archive, or restore.
- **Child safety & harmful content:** reject and remove sexual content involving minors, harassment, doxxing, incitement, or material that promotes harm; standard trust-and-safety baseline.
- **Anti-finger-pointing rule** is explicit and enforced, mirroring the work's own purification (e.g., the enemy is never a people).
- Rate-limiting / basic spam protection on submissions and sign-ups.

---

## 11. Tone, Design & Accessibility

- **Reverent, warm, luminous, uncluttered.** Reading the gathered text should feel like reading scripture, not browsing an app. Generous whitespace, beautiful serif body type for renderings, calm palette.
- Mobile-first and fully responsive; readable one-handed.
- WCAG-minded: high contrast option, scalable text, semantic HTML, keyboard navigation, screen-reader labels.
- Internationalization-ready (text direction, language metadata) even before full translation ships.
- Microcopy is gentle and inviting throughout ("Offer a rendering," "This resonates," "Add your light"), never competitive.

---

## 12. Suggested Tech Stack (buildable with Claude Code)

- **Framework:** Next.js (App Router, React, TypeScript).
- **Styling:** Tailwind CSS.
- **DB + Auth:** Supabase (Postgres + email magic-link auth + row-level security) — or SQLite/Prisma for a simpler local start.
- **ORM/queries:** Prisma (or Supabase client).
- **Markdown:** render rendering/tenet bodies as sanitized Markdown.
- **Hosting:** Vercel (web) + Supabase (data).
- **Seed:** import the existing full rendering as the initial set of Movements, Passages, and Gathered Renderings; import an initial Tenets library.

> Keep the MVP a single Next.js app with server actions/route handlers and Postgres. Avoid premature microservices.

---

## 13. Seed Content (provided by owner)

- The existing **plain, pure rendering of Revelation** (the full work) → import as Movements, Passages, and initial Gathered Renderings, each mapped to its canonical reference.
- An initial **Tenets library**, e.g.: *Everything hangs on the two great commandments* · *Christ is the Word* · *Tares are lies, not people; no one is a tare* · *The day is great and dreadful — dreadful only to fear* · *The beast is within, to be loved into a lamb, not destroyed* · *Babylon is a system, never a people* · *Salvation is remembering who we are* · *Gather every truth from every culture; balance all of God's attributes in harmony.*
- The **mission / invitation** text for the landing page.

---

## 14. MVP Acceptance (definition of done for v1)

A signed-in member can: read the seeded gathered book by Movement and Passage; view the traditional text alongside; read all alternative renderings for a passage with their tenets; submit a new rendering citing tenets; browse and submit tenets; leave reflections; express resonance; and a steward can promote a Gathered Rendering with recorded history. The mission page, guidelines, and flagging exist. It is beautiful, calm, mobile-friendly, and welcoming.

---

## 15. Open Questions (owner decisions)

1. **Anonymous reading vs. sign-in to view** — recommend fully open reading; sign-in only to contribute.
2. **Who becomes a Steward, and how?** (invite-only at first vs. earned by resonance/tenure.)
3. **One Gathered Rendering per passage, or allow a small set of co-equal gathered renderings** when the community genuinely diverges?
4. **Languages at launch** — English-only MVP with i18n-ready data model, or seed a second language immediately?
5. **How prominent is the "gather in prayer" element** — core to identity, or a quiet Phase 2 space?
6. **Licensing of contributions** — recommend an open license (e.g., CC BY-SA) so the gathered Word stays free and shareable; confirm.
