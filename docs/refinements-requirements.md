# Requirements — Refinements (Proposed Edits to a Rendering)

*Lets a contributor propose a specific change to an existing rendering — a refinement the author and stewards can gather in, set aside with thanks, or discuss — rather than offering a whole new rendering. Builds on Margin Notes (a suggested wording can become a refinement) and on the gathered-rendering mechanic. Pairs with the reader, Notes, and version history.*

---

## 0. Governing principles (read first)

1. **A refinement improves *this* rendering; a new telling is a *new rendering*.** Refinements are targeted changes to an existing rendering's text. If someone wants a wholly different telling, they offer a new rendering instead — not a refinement. This line keeps the two features distinct.
2. **A refinement is a gift, gently offered and freely received.** The author is never obligated. "Gather in" and "set aside with thanks" are both honorable outcomes.
3. **Here a diff is appropriate.** Unlike comparison mode (parallel reading of *different* texts, never diffed), a refinement is a proposed change to the *same* text, so showing a true before/after of the affected span is correct and expected.
4. **Anchors must be robust** — same discipline as Notes: bind to the rendering version, store quoted text + context, re-anchor or mark stale on edit, never apply onto text it wasn't about.
5. **Nothing is final.** Accepting a refinement creates a new version with full history and attribution; declining preserves the proposal, gently closed.

---

## 1. Purpose & scope

- **In scope (v1):** a signed-in member proposes one or more span-anchored changes to a published rendering (a replacement for a selected span, with a reason and the tenets it serves); the author/stewards review, discuss, and accept (→ new version) or decline (→ closed, with thanks); a scoped before/after diff; robust anchoring; attribution.
- **Bridge:** a Margin Note's optional "suggested wording" can be promoted into a refinement, carrying over its anchor and suggested text.
- **Out of scope (v1):** whole-rendering wholesale rewrites (that's offering a new rendering); auto-merging multiple refinements; line-by-line collaborative editing; refinements to the traditional (KJV) text.

---

## 2. Concept & glossary

- **Refinement** — A proposed change to an existing rendering: one or more **changes**, a reason, and the tenets it serves. Has status and history.
- **Change** — A single span-anchored edit within the refinement: the anchored original span + the proposed replacement text.
- **Anchor** — As in Notes: `rendering_id` + `rendering_version_id` + offsets + `quoted_text` + `context_prefix`/`context_suffix`.
- **Outcomes** — `gathered_in` (accepted → new version), `set_aside` (declined, with thanks), `withdrawn` (by proposer), `stale` (the base text moved and the change no longer applies cleanly).

---

## 3. Functional requirements

### FR-1 Proposing a refinement
- **FR-1.1** A signed-in member selects a span in a published rendering and chooses **Suggest a refinement** (distinct from "Leave a note").
- **FR-1.2** They enter the **proposed replacement** for that span, a short **reason**, and optionally the **tenets** the refinement serves.
- **FR-1.3** A refinement may bundle **multiple changes** across the same rendering before submitting.
- **FR-1.4** The compose view shows a live **before/after** of each affected span (a scoped diff).
- **FR-1.5** Logged-out readers get a gentle sign-in nudge instead.

### FR-2 Promotion from a Note
- **FR-2.1** A Margin Note that includes a suggested wording can be **promoted to a refinement** by its writer, the author, or a steward, carrying over the anchor and the suggested text into a new refinement draft.

### FR-3 Anchoring & staleness
- **FR-3.1** Each change stores the version-bound anchor (offsets + quoted text + context), as in Notes.
- **FR-3.2** If the rendering changes before review, re-anchor each change by matching its quoted text + context; if it no longer applies cleanly, mark that change **stale** and ask the proposer to revisit. Never apply a change onto shifted/wrong text.
- **FR-3.3** A refinement with any stale change cannot be gathered in until revisited.

### FR-4 Review & discussion
- **FR-4.1** The rendering's author and stewards see refinements on that rendering in a review queue, each showing all changes as before/after, the reason, tenets, proposer, date, and status.
- **FR-4.2** A gentle reply thread is attached to each refinement (proposer, author, stewards), under the community guidelines.

### FR-5 Outcomes
- **FR-5.1** **Gather in (accept):** the author or a steward accepts; the system applies the change(s) and creates a **new rendering version**, recording the proposer in history (attribution) plus an optional note.
- **FR-5.2** If the rendering is the **gathered rendering** for its passage, gathering it in updates the gathered rendering (new version) and is recorded in the passage's gathering history.
- **FR-5.3** **Set aside (decline):** the author or a steward declines, with an optional gentle reason; the refinement is preserved and closed, the proposer thanked in copy.
- **FR-5.4** **Withdraw:** the proposer may withdraw their own open refinement.
- **FR-5.5** Partial acceptance: the reviewer may gather in some changes and set others aside within one refinement (each change resolves independently).

### FR-6 Conflicts
- **FR-6.1** Multiple open refinements may target overlapping spans. Accepting one re-bases the others; any change that no longer applies cleanly becomes **stale** (FR-3.2), never auto-applied over the new text.
- **FR-6.2** Concurrency is last-write-wins at the version level; the diff a reviewer sees is always against the current version.

### FR-7 Permissions
- **FR-7.1** Propose: any signed-in member, on any published rendering (including, naturally, the gathered one).
- **FR-7.2** Review / accept / decline: the rendering's author and stewards.
- **FR-7.3** Withdraw / edit own draft: the proposer.
- **FR-7.4** Reply: proposer, author, stewards.

### FR-8 Notifications
- **FR-8.1** The author is quietly notified of a new refinement and of replies; the proposer is notified of the outcome. No nagging, no streaks (per the project's stance).

### FR-9 Moderation & safety
- **FR-9.1** Refinements and replies follow the community guidelines; both are flaggable.
- **FR-9.2** Stewards can hide/remove; child-safety and harmful-content baseline applies; rate-limiting prevents spam.

### FR-10 Display & accessibility
- **FR-10.1** The before/after diff is readable, scoped to the affected span(s), and distinguishable without relying on color alone (e.g., markers/labels, not just red/green).
- **FR-10.2** Selection, compose, review, and accept/decline are fully keyboard- and touch-operable, with labeled regions and predictable focus.
- **FR-10.3** No horizontal scroll; on narrow screens the diff stacks before→after rather than side-by-side if width is insufficient.
- **FR-10.4** Respect `prefers-reduced-motion`.

### FR-11 Tone & framing
- **FR-11.1** Copy frames refinements as gifts and outcomes as honorable either way (see microcopy). Never "approve/reject"; use "gather in" / "set aside with thanks."

---

## 4. Microcopy (in voice)

- Action: **Suggest a refinement**
- Compose intro: *Offer a refinement to this rendering — a wording you believe brings the love and truth through more clearly. The one who offered it, and the stewards, will weigh it gently.*
- Replacement label: *Your proposed wording*
- Reason label: *Why this refines it*
- Tenets label: *Tenets it serves (optional)*
- Submit: **Offer the refinement** → confirm: *Offered. Held gently, and weighed in love.*
- Promote-from-note: **Make this a refinement**
- Reviewer actions: **Gather it in** · **Set aside, with thanks**
- Accept confirm: *Gathered in. The rendering grows by another hand.*
- Decline confirm (to proposer): *Set aside with thanks — your offering is kept, and it helped.*
- Stale badge: *The text beneath this has changed — revisit to offer it again.*
- Empty review queue: *No refinements waiting — the rendering rests as it is, for now.*

---

## 5. Data model (additions)

- **refinements**: id, rendering_id, base_rendering_version_id, proposer_id, reason, status (`open` | `gathered_in` | `set_aside` | `withdrawn`), created_at, updated_at.
- **refinement_changes**: id, refinement_id, anchor_start, anchor_end, quoted_text, context_prefix, context_suffix, replacement_text, change_status (`open` | `gathered_in` | `set_aside` | `stale`).
- **refinement_tenets**: refinement_id, tenet_id.
- **refinement_replies**: id, refinement_id, author_id, body, created_at.
- Accepting writes a new **rendering_versions** row (existing table), with `edited_by` = accepting steward/author and a note crediting the proposer.
- Extend **flags.target_type** to include `refinement`, `refinement_reply`.

---

## 6. Acceptance criteria (testable)

- **AC-1** A signed-in member can select a span, propose a replacement with a reason (and optional tenets), bundle multiple changes, and see a live before/after.
- **AC-2** A Note with a suggested wording can be promoted into a refinement carrying its anchor and text.
- **AC-3** The author/stewards can review the diff, reply gently, and **gather in** (→ new version, proposer credited) or **set aside with thanks** (→ preserved, closed); changes can resolve independently.
- **AC-4** Gathering in a refinement to the gathered rendering updates it and is recorded in the passage's gathering history.
- **AC-5** If the base text changed, affected changes are marked **stale** and are never auto-applied onto wrong text; the refinement can't be gathered in until revisited.
- **AC-6** Refinements/replies can be flagged and removed; rate-limiting prevents spam.
- **AC-7** Proposing, reviewing, and resolving work by keyboard and touch, with a color-independent diff and no horizontal scroll.

---

## 7. Out of scope (future)

- Wholesale rewrites as refinements (offer a new rendering instead).
- Automatic merging of multiple refinements.
- Real-time collaborative editing.
- Promoting a refinement-thread into a public reflection (keep channels distinct for now).

---

## 8. Claude Code kickoff prompt (paste to build)

> Add **Refinements** (proposed edits) to The Unsealed Revelation: a signed-in member proposes a targeted change to an existing rendering, which the author/stewards can gather in or set aside with thanks. Read `refinements-requirements.md` first; it's the source of truth. Honor §0: a refinement changes *this* rendering (a whole new telling is a new rendering, not a refinement); here a **scoped before/after diff is correct** (unlike comparison mode, which never diffs); anchors bind to the rendering version with quoted text + context and either re-anchor or go **stale** — never applied onto wrong text; accepting creates a new version with proposer attribution; nothing is deleted. Keep existing values: reverent, gentle, never ranked, mobile-first.
>
> Build per FR-1..FR-11: span selection → "Suggest a refinement" → proposed replacement + reason + optional tenets, bundling multiple changes, with a live before/after; promotion from a Margin Note's suggested wording; an author/steward review queue with diffs, gentle replies, and **Gather it in** / **Set aside, with thanks** (changes resolvable independently); update the gathered rendering + gathering history when applicable; staleness handling when the base text moved; quiet notifications; flagging + steward removal + rate-limiting; a **color-independent** diff; full keyboard + touch access, no horizontal scroll. Add the `refinements`, `refinement_changes`, `refinement_tenets`, `refinement_replies` tables, write a new `rendering_versions` row on accept, and extend flags. Meet AC-1..AC-7.
>
> Show me your anchoring + staleness approach and the accept→new-version flow **before** building (this must reuse the same anchor design as Margin Notes). Do not build wholesale rewrites, auto-merge, or real-time editing. Propose the plan, wait for my OK, then build, and summarize what changed.
