# Feature Spec — Arrangements (Proposing an Ordering of the Book)

*An **Arrangement** is a contributor's proposed ordering of the whole book — the passages sequenced and grouped into the author's own movements, with their reasoning and the tenets it expresses. The reordering of Revelation in love is itself an act of unsealing, so an Arrangement is a first-class, book-level contribution that sits beside others — never ranked, refined by many hands, nothing final.*

---

## 1. Why this belongs

The project's founding insight is that Revelation has been reordered, and that re-sequencing it in love reveals its true arc. Different contributors will see different arcs. This feature lets each propose their own — making the **order itself** a contribution that can be read, resonated with, discussed, and gathered, exactly like a rendering.

It also lets a contributor present **their edition**: their ordering paired with their own chosen renderings at each position — the fullest expression of one person's telling.

---

## 2. Core concept & glossary

- **Arrangement** — A named, authored ordering of the entire book: every passage placed in a sequence, grouped into the author's own movements. Has a title, description (the reasoning), tenets it expresses, resonance, reflections, and full version history.
- **Arrangement Movement** — A grouping within one arrangement (title + subtitle), containing an ordered set of passages. (Movements now belong to an arrangement, not to the book globally.)
- **Arrangement Entry** — A passage placed at a position within an arrangement (and within one of its movements), optionally pinning a **featured rendering** for that position and a short per-position note ("why this comes here").
- **The Love-Ordered Arrangement** — The seed/default arrangement (the current 7 movements and order). Clearly labeled as the current gathered arrangement, but never "the only right one."
- **The Canonical Order** — A built-in, auto-generated arrangement that sequences passages by canonical reference (Rev 1 → 22), so readers can always read straight-canonical.
- **Reading through** — Selecting an arrangement re-sequences the reader (the passage list and Previous/Next nav) to that arrangement.

---

## 3. Guiding values (unchanged, applied here)

- **Side by side, never ranked.** Arrangements are presented as equals; resonance is additive only (no downvotes). The default is labeled as the current gathering, not the winner.
- **Nothing is final.** Arrangements are versioned; the gathered/default arrangement can change as the community converges.
- **Grounded always.** Canonical references stay attached to every passage in every arrangement, so no ordering loses the anchor to the traditional text.
- **Gentle and reverent.** The builder and the reader selector feel calm and inviting, never like a power tool.

---

## 4. Data model (additions & one refactor)

**Refactor:** `movements` move from global to belonging to an arrangement. (Today's 7 movements become the movements of *The Love-Ordered Arrangement*.)

New / changed tables:

- **arrangements**: id, author_id, title, slug, description, tenets[] (via join), status (draft|published|archived), is_default (bool), is_system (bool, for Canonical Order), created_at, updated_at.
- **arrangement_movements**: id, arrangement_id, title, subtitle, order_index.
- **arrangement_entries**: id, arrangement_id, arrangement_movement_id (nullable), passage_id, order_index, featured_rendering_id (nullable), note (nullable).
- **arrangement_versions**: id, arrangement_id, snapshot (json of movements+entries), edited_by, note, created_at. *(history)*
- **arrangement_tenets**: arrangement_id, tenet_id. *(many-to-many — the tenets this ordering expresses)*
- Extend **resonances.target_type** and **reflections.target_type** to include `arrangement`.
- **passages** remain global atoms (id, canonical_ref, traditional_text, title, slug). They no longer hold a single global movement/order; their position is defined per arrangement.

> Constraint for v1: an arrangement must reference **every passage exactly once** (a complete ordering). Validate on publish.

---

## 5. Pages & IA

- `/arrangements` — Browse all arrangements. The current gathered (default) is featured at top; others sit below, side by side, each with author, title, description, a compact visual of its movements→passages, and resonance. Includes the two built-ins (Love-Ordered, Canonical).
- `/arrangements/[slug]` — A single arrangement: its movements and passages in order, its reasoning, the tenets it expresses, reflections, resonance, version history, and a primary **"Read the book this way"** action.
- `/arrangements/new` and `/arrangements/[slug]/edit` — The **builder** (see §6).
- `/read` — Gains an **arrangement selector** ("Reading: {name} ▾"). Selection persists per user (or session for logged-out) and re-sequences the movement/passage list.
- `/read/[movement]/[passage]` — Within a passage, Previous/Next follow the active arrangement; show the passage's position in the active arrangement ("Passage 3 of 23 · The Love-Ordered Arrangement"); optionally "this passage appears in N arrangements." If the active arrangement pins a featured rendering, lead with it (still showing the gathered rendering and alternatives below).

---

## 6. The Builder (core UX)

Start from a copy of an existing arrangement (default recommended) or blank.

- **Sequence:** a draggable list of all 23 passages; drag to reorder freely.
- **Group:** insert movement headers (title + subtitle); passages live under a movement; movements reorder too.
- **(v1.5) Feature a rendering per position:** for each passage, optionally choose which rendering to feature here (defaults to the gathered rendering; may be the author's own or any alternative). This is what makes it "their edition."
- **(optional) Per-position note:** "why this comes here."
- **Meta:** title, description (the reasoning for this arc), and tenets it expresses (link from the tenets library).
- **Validation:** every passage present exactly once before publish; clear, gentle inline guidance if not.
- **Save draft / Publish.** Drafts are private to the author until published.

Builder must be keyboard-accessible (drag-and-drop with keyboard alternatives) and work on mobile (a simple move-up/move-down or reorder mode if full drag is impractical on touch).

---

## 7. Reader integration

- The arrangement selector is visible on `/read` and within passages.
- Default for everyone (including logged-out) is **The Love-Ordered Arrangement**.
- Switching arrangements re-renders the movement/passage list and the in-passage Previous/Next, and updates the position indicator.
- If the active arrangement pins featured renderings, those lead each passage; otherwise the gathered rendering leads. Alternatives and the traditional text remain available regardless.

---

## 8. Gathering & stewardship (Phase 2)

Mirror the gathered-rendering mechanic at the book level: there is one **current gathered arrangement** (the default). A steward can promote a different arrangement (or a merged one) to default as the community converges, with recorded history and a note. Resonance surfaces where the community is gathering, but a human always makes the gathering act. The Canonical Order and any published arrangement always remain available regardless of which is default.

---

## 9. Build phases

**Phase 1 (MVP):**
- Refactor movements to belong to an arrangement; seed *The Love-Ordered Arrangement* from current data; generate *The Canonical Order*.
- `/arrangements` browse + `/arrangements/[slug]` view.
- Builder: sequence + grouping + meta + tenets; validation; draft/publish; version history.
- Reader arrangement selector with persistence and re-sequencing; position indicator.
- Resonance + reflections on arrangements.

**Phase 1.5 (the edition layer):**
- Pin a featured rendering (and optional note) per position in the builder; reader leads with pinned renderings.

**Phase 2:**
- Steward-promoted gathered (default) arrangement with history.
- "This passage in other arrangements" cross-links; compare two arrangements side by side.

---

## 10. Open decisions (owner)

1. **UI label** — recommend "Arrangement" (distinct from rendering/telling). Alternatives: "Ordering," "a way through the book."
2. **Complete orderings only (v1)?** — recommend yes (every passage once); allow omission/partial paths later.
3. **Splitting/merging passages** — out of scope for v1; passages stay fixed atoms. Revisit only if contributors need finer units.
4. **Who may publish an arrangement** — any signed-in member, or earned over time? Recommend open, with gentle guidelines.
5. **Default-arrangement promotion** — steward-gathered (recommended) vs. resonance-thresholded (avoid — keep it relational).

---

## 11. Claude Code kickoff prompt (paste to start Phase 1)

> I'm adding an **Arrangements** feature to The Unsealed Revelation — contributors propose their own ordering of the whole book. Read `arrangement-feature-spec.md` first; it's the source of truth. Keep all existing values: side by side and never ranked (resonance is additive only), nothing is final (version everything), reverent and calm, mobile-first, grounded (canonical refs stay on every passage).
>
> **Phase 1 only, and propose your schema-migration plan before changing the database.** The key refactor: movements currently appear global, but they must become properties of an *arrangement*. Migrate today's 7 movements and passage order into a seeded default arrangement called **"The Love-Ordered Arrangement"**, and generate a system arrangement **"The Canonical Order"** that sequences passages by canonical reference (Rev 1→22). Passages stay global atoms.
>
> Then build: (1) `/arrangements` browse and `/arrangements/[slug]` view, with the default featured and others side by side, each showing author, description, a compact movements→passages outline, and resonance; (2) a builder at `/arrangements/new` and `/edit` to sequence passages (draggable, with keyboard + mobile fallbacks), group them into movements (title + subtitle), add a title/description and the tenets it expresses, validate that every passage appears exactly once, save as draft, and publish — with version history; (3) an arrangement selector on `/read` that persists per user/session and re-sequences the movement/passage list and in-passage Previous/Next, plus a position indicator ("Passage 3 of 23 · {arrangement}"); (4) resonance and reflections on arrangements.
>
> Do **not** build the featured-rendering-per-position layer or steward promotion yet — those are later phases. Propose the migration + your page/component plan, wait for my OK, then build. Summarize what changed when done.
