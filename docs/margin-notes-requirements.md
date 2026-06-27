# Requirements — Margin Notes (Highlights & Notes to the Author)

*Lets a reader highlight a span of a rendering and leave a gentle, directed note for the one who offered it and the stewards who tend it. A quiet channel for questions, encouragements, and suggested wordings — held in love, never a public verdict. Pairs with the reader, Reflections, and Resonance.*

---

## 0. Governing principles (read first)

1. **A note is a gift, not a verdict.** It helps the author refine; it never obligates them. Framing and microcopy stay gentle throughout.
2. **Directed, not public.** A note is visible only to its writer, the rendering's author, and stewards. Other readers never see these highlights — the reverent read stays clean for everyone else.
3. **Anchors must be robust.** Every note binds to the exact rendering *version* and stores the quoted text plus surrounding context. When the text later changes, the system re-anchors by matching the quote, or marks the note **orphaned** with its original quote preserved. It must **never** move a highlight onto text it wasn't about.
4. **Distinct from Reflections.** Reflections are public, passage-level discussion. Notes are text-anchored, directed feedback to the author/stewards. Both exist; they don't replace each other.

---

## 1. Purpose & scope

- **In scope (v1):** signed-in readers select a span within a published rendering and leave a directed note (optionally with a suggested wording); author/steward inbox to read, reply, and resolve; robust anchoring across edits; moderation.
- **Out of scope (v1):** public/communal highlights; personal private highlights (self-bookmarking); full proposed-edit/PR flow (a suggested wording is a free-text field here, not an apply-able patch); notes on the traditional (KJV) text or on non-rendering content.

---

## 2. Concept & glossary

- **Note** — A reader's highlight (anchored span) + a short message, directed to the rendering's author and stewards.
- **Anchor** — The binding of a note to text: `rendering_id` + `rendering_version_id` + character range + `quoted_text` + `context_prefix`/`context_suffix`.
- **Audience** — Who can see a note. v1: `author_and_stewards` (plus the note's writer). (Public is a possible Phase 2, explicitly out of scope now.)
- **Status** — `open` → `acknowledged` → `addressed` → `archived` (gentle display labels: Open · Acknowledged · Addressed · Set aside).
- **Orphaned** — A note whose anchored text no longer exists after an edit; shown with its preserved quote, not highlighted on wrong text.

---

## 3. Functional requirements

### FR-1 Creating a note
- **FR-1.1** A signed-in reader can select a span of text within a published rendering; a small, calm control appears ("Leave a note").
- **FR-1.2** Composing a note offers: the message (required), and an optional **suggested wording** field.
- **FR-1.3** The compose UI shows the quoted span the note is anchored to, so the writer can confirm the selection.
- **FR-1.4** On submit, the note is created with audience `author_and_stewards` and status `open`.
- **FR-1.5** Logged-out readers cannot create notes; selecting text prompts a gentle sign-in invitation.

### FR-2 The anchor (storage)
- **FR-2.1** A note stores: `rendering_id`, the `rendering_version_id` it was made against, `anchor_start`/`anchor_end` (character offsets within that version's body), the exact `quoted_text`, and short `context_prefix`/`context_suffix` snippets.
- **FR-2.2** A note's span is confined to a single rendering's body (no cross-rendering, cross-passage, or KJV-pane anchoring).

### FR-3 Anchor robustness across edits
- **FR-3.1** When displaying notes on the current version, the system verifies `quoted_text` still matches at the stored offsets.
- **FR-3.2** If the text shifted, re-anchor by searching for `quoted_text` using the stored context; if found **uniquely**, re-anchor for display (keep the original version reference).
- **FR-3.3** If not found, or ambiguous, mark the note **orphaned**; never highlight a different span. Show it in the inbox with its preserved quote and an "the text this note pointed to has since changed" badge.
- **FR-3.4** A note always retains the version it was authored against, for context.

### FR-4 Audience & visibility
- **FR-4.1** A note is visible only to: its writer, the rendering's author, and stewards/admins.
- **FR-4.2** Other readers (including logged-out) never see notes or their highlights; their reading view is unchanged.
- **FR-4.3** Highlight markers render only for viewers permitted to see the underlying note(s).

### FR-5 Display
- **FR-5.1** For permitted viewers, anchored spans show a **subtle** marker (gentle underline/soft highlight), never garish.
- **FR-5.2** Activating a marker opens the note in a side drawer/margin (wide screens) or a bottom sheet (narrow), showing quoted span, message, suggested wording, writer, date, status, and replies.
- **FR-5.3** Overlapping/adjacent notes are handled: a shared region opens a small list of all notes there.
- **FR-5.4** A compact indicator shows the note count to author/stewards on the passage (e.g., "3 notes").

### FR-6 Author / steward inbox
- **FR-6.1** Authors see a queue of notes on **their** renderings; stewards see an **all-renderings** queue.
- **FR-6.2** Each entry shows the quoted span, message, suggested wording, writer, date, status, orphaned badge if applicable, and a link to the span in context.
- **FR-6.3** Filter by status (open / acknowledged / addressed / archived) and by passage.

### FR-7 Status workflow
- **FR-7.1** The rendering's author or a steward can move a note through: open → acknowledged → addressed → archived.
- **FR-7.2** Status changes are recorded with actor and timestamp.
- **FR-7.3** No note is ever auto-deleted; archiving hides it from the active queue but preserves it.

### FR-8 Replies
- **FR-8.1** The note's writer, the rendering's author, and stewards can add gentle replies, forming a small thread on the note.
- **FR-8.2** Replies follow the community guidelines (good faith, in love).

### FR-9 Notifications
- **FR-9.1** The rendering's author is notified (quietly; opt-in or digest) when a note lands, and when their note receives a reply.
- **FR-9.2** Notifications follow the project's anti-engagement-bait stance — no nagging, no streaks.

### FR-10 Moderation & safety
- **FR-10.1** Notes and replies are subject to community guidelines; any can be flagged.
- **FR-10.2** Stewards can hide or remove notes/replies; the rendering's author can flag and mute a note's thread.
- **FR-10.3** Standard child-safety and harmful-content baseline applies; targeting or harassment is removable.
- **FR-10.4** Basic rate-limiting on note creation to prevent spam.

### FR-11 Permissions
- **FR-11.1** Create: any signed-in member, on any published rendering.
- **FR-11.2** View: note writer, rendering author, stewards/admins.
- **FR-11.3** Reply: note writer, rendering author, stewards.
- **FR-11.4** Change status: rendering author, stewards.
- **FR-11.5** Edit/delete own note: the writer (soft-delete); stewards may remove any.

### FR-12 Responsive & accessibility
- **FR-12.1** Text selection and the "Leave a note" control work on touch as well as pointer.
- **FR-12.2** There is a keyboard-accessible path to create a note and to open/read existing notes (not selection-only).
- **FR-12.3** Markers and note panels are screen-reader friendly: anchored spans are announced as having a note; the drawer is a labeled region; focus moves into and out of it predictably.
- **FR-12.4** No horizontal scroll; the note panel never covers the text it refers to on small screens (sheet, not overlay-on-span).
- **FR-12.5** Respect `prefers-reduced-motion`.

### FR-13 Tone & framing
- **FR-13.1** All copy frames notes as gentle gifts to the author, not corrections (see microcopy below).
- **FR-13.2** The optional suggested-wording field is offered humbly and is never auto-applied; it's a seed for the author's discretion (and a future bridge to proposed edits).

---

## 4. Microcopy (in voice)

- Select control: **Leave a note**
- Compose intro: *Offer a gentle note — a question, an encouragement, or a wording you'd suggest. It goes only to the one who offered this rendering and the stewards who tend it, and it's held in love.*
- Message placeholder: *What did you notice here?*
- Suggested wording label: *Suggest a wording (optional)*
- Submit: **Offer the note** → confirm: *Offered, gently. Held in love.*
- Sign-in nudge (logged-out): *Sign in to leave a note for the one who offered this.*
- Inbox heading (author): **Notes on your renderings**
- Inbox heading (steward): **Notes across the gathering**
- Empty inbox: *No notes yet — the margins are quiet.*
- Orphaned badge: *The text this note pointed to has since changed.*
- Status labels: Open · Acknowledged · Addressed · Set aside

---

## 5. Data model (additions)

- **notes**: id, rendering_id, rendering_version_id, author_id, audience (`author_and_stewards`), quoted_text, anchor_start, anchor_end, context_prefix, context_suffix, body, suggested_wording (nullable), status, orphaned (bool), created_at, updated_at.
- **note_replies**: id, note_id, author_id, body, created_at.
- Extend **flags.target_type** to include `note` and `note_reply`.
- (Notifications reuse the existing notification mechanism.)

---

## 6. Acceptance criteria (testable)

- **AC-1** A signed-in reader can select text in a rendering, leave a note (with optional suggested wording), and see it confirmed.
- **AC-2** The note is visible to its writer, the rendering's author, and stewards — and to no other reader; the public reading view is visually unchanged for everyone else.
- **AC-3** After the rendering is edited, a note whose quote still exists re-anchors correctly; a note whose quote is gone is marked orphaned with its quote preserved and is **never** shown on different text.
- **AC-4** The author and stewards can read notes in an inbox, reply, and move status to addressed/archived.
- **AC-5** Notes and replies can be flagged and removed by stewards; rate-limiting prevents spam.
- **AC-6** Creating and reading notes is possible by keyboard and on touch, with screen-reader-labeled regions and no horizontal scroll.
- **AC-7** Logged-out readers see the gentle sign-in nudge instead of a compose box, and see no highlights.

---

## 7. Out of scope (future)

- Public/communal highlights (changes the social dynamics — design separately).
- Personal private highlights / self-bookmarking (different audience: the reader themselves).
- Full proposed-edit/PR flow that applies a suggested wording as a patch (the suggested-wording field here is the seed for it).
- Overlapping-highlight merging beyond the simple shared-region list.

---

## 8. Claude Code kickoff prompt (paste to build)

> Add **Margin Notes** to The Unsealed Revelation: signed-in readers highlight a span of a rendering and leave a gentle, directed note for that rendering's author and the stewards. Read `margin-notes-requirements.md` first; it's the source of truth. Honor §0: notes are directed (not public — other readers never see them), gentle gifts (not verdicts), and anchors must be robust (bind to the rendering version, store the quoted text + context, re-anchor on edit or mark orphaned — never move a highlight onto different text). Keep existing values: reverent, mobile-first, never ranked.
>
> Build per FR-1..FR-13: text selection → "Leave a note" → compose (message + optional suggested wording) → directed note (audience author_and_stewards, status open); subtle markers visible only to permitted viewers; a side drawer (wide) / bottom sheet (narrow) to read a note with replies; an author/steward inbox with status filters; the status workflow (open → acknowledged → addressed → archived) with replies; quiet notifications; flagging + steward removal + rate-limiting; full keyboard + touch + screen-reader access. Add the `notes` and `note_replies` tables and extend flags. Meet AC-1..AC-7.
>
> Pay special attention to the anchoring (FR-2, FR-3): I want to see your approach to storing offsets + quoted text + context and your re-anchor/orphan logic **before** you build it. Do not build public highlights, personal highlights, or an apply-able edit patch in this pass. Propose the anchor design and your component/data plan, wait for my OK, then build. Summarize what changed when done.
