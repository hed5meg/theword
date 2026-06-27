# Requirements — Comparison Mode

*Lets a reader place two texts side by side on a passage — most powerfully the traditional (sealed) text against the pure rendering — to see the transfiguration directly. Pairs with the live reader and the Arrangements feature. Tone and values unchanged: reverent, never ranked, grounded.*

---

## 0. The governing principle (read first)

**Comparison mode is parallel reading, not a diff.** The renderings are creative re-tellings of Revelation, *not* verse-aligned translations. Therefore the system must **never**:
- attempt automatic verse/line/paragraph alignment between two different texts, or
- compute or display a word-level "diff" between a rendering and the traditional text, or between two different renderings.

It presents two chosen texts in two columns that the reader reads independently. (A true line-level diff is meaningful **only** between two *versions of the same rendering* — that is the version-history feature, explicitly out of scope here.)

---

## 1. Purpose & scope

- **In scope (v1):** passage-level comparison of any two of {traditional text, gathered rendering, each published rendering} on a single passage page.
- **Secondary (Phase 2):** book-level comparison of two *Arrangements* (orderings). See §9.
- **Out of scope (v1):** version-to-version diff of one rendering; 3+ panes; synchronized scrolling; word-level highlighting; cross-passage comparison.

---

## 2. Functional requirements — passage comparison

### FR-1 Entry & exit
- **FR-1.1** Each passage page has a **Compare** control that toggles comparison mode on and off.
- **FR-1.2** The default passage view remains single-column reverent reading; comparison is opt-in and fully reversible.
- **FR-1.3** Exiting comparison returns to the normal reading view without a jarring scroll jump.

### FR-2 Panes & selection
- **FR-2.1** Comparison shows exactly **two** text panes (2-up).
- **FR-2.2** Each pane has a header naming what it shows and a **picker** to change it.
- **FR-2.3** Selectable per pane: the **Traditional text (KJV)** for this passage; the **Gathered Rendering**; each **published rendering** (labeled by author/title and language).
- **FR-2.4** **Default on entering compare:** left = Traditional text, right = Gathered Rendering. (This surfaces the move from the sealed text to the pure rendering — the emotional payoff of the whole project.)
- **FR-2.5** Each pane's selection is independent.
- **FR-2.6** A **swap-sides** control (⇄) flips the two panes' contents.
- **FR-2.7** If both panes select the same text, show a gentle inline note ("You're comparing a text with itself") rather than erroring.

### FR-3 Reading behavior
- **FR-3.1** Panes **scroll independently** by default. No forced/synchronized scroll.
- **FR-3.2** No automatic alignment and no diff between distinct texts (see §0).
- **FR-3.3** Each pane preserves the reverent reading typography (serif body, comfortable measure).
- **FR-3.4** A rendering pane shows its compact metadata (author/title, language, tenets) consistent with the reading view; the traditional pane shows its canonical reference.

### FR-4 Persistence & sharing
- **FR-4.1** Compare state (on/off + both selections) is encoded in the **URL query**, so a comparison is shareable, bookmarkable, and survives refresh (e.g. `?compare=traditional,gathered` or rendering IDs).
- **FR-4.2** Opening such a URL restores that exact comparison.

### FR-5 Responsive
- **FR-5.1** Wide viewports (≈ ≥1024px): two columns side by side, each at a readable measure (~45–75 characters).
- **FR-5.2** If two columns cannot both meet a minimum readable width, fall back to the narrow pattern.
- **FR-5.3** Narrow viewports: a **segmented A | B switch** (or swipe) shows one selected text at a time, with both pickers still reachable, clearly framed as a comparison (not as the default single read).
- **FR-5.4** No horizontal page scroll at any viewport.

### FR-6 Accessibility
- **FR-6.1** The Compare toggle, pickers, swap control, and A|B switch are fully keyboard-operable with visible focus.
- **FR-6.2** Each pane is a labeled region (`aria-label` naming its content).
- **FR-6.3** Entering/exiting comparison and switching A|B are announced via `aria-live="polite"`.
- **FR-6.4** Respect `prefers-reduced-motion` (no animated column/pane transitions when set).
- **FR-6.5** Contrast meets WCAG AA; the two panes are distinguishable without relying on color alone (e.g., a divider and headers).

### FR-7 Edge cases
- **FR-7.1** Passage with no alternative renderings: comparison still offers Traditional ↔ Gathered.
- **FR-7.2** Passage with fewer than two available texts: the Compare control is **disabled** with a tooltip explaining why.
- **FR-7.3** Long passages (e.g., The City — Home, 21:1–22:21): independent scroll; optional per-pane "back to top." No forced sync.
- **FR-7.4** Very uneven text lengths: acceptable; never pad or align to match.
- **FR-7.5** A rendering referenced in a compare URL that has since been archived/removed: fall back gracefully — show a gentle "this text is no longer available" and reset that pane to the Gathered Rendering.
- **FR-7.6** Interaction with Arrangements: passage comparison is independent of the active arrangement; it works the same regardless of which arrangement the reader is in.

### FR-8 Values
- **FR-8.1** Neither pane is presented as "correct" or "better." Labels are neutral; when comparing two community renderings, present them as equals (no left=primary framing).
- **FR-8.2** The affordance is calm and reverent — not a developer "diff tool" aesthetic.

---

## 3. Acceptance criteria (testable)

- **AC-1** From any passage with ≥2 texts, the reader can enter Compare and see **Traditional ↔ Gathered** by default.
- **AC-2** The reader can change either pane to any other available text and can swap sides.
- **AC-3** It renders as two readable columns on desktop and as an A|B switch on narrow screens, with **no horizontal scroll**.
- **AC-4** The compare state is in the URL; a shared link reproduces the exact comparison.
- **AC-5** No diff or alignment is attempted between distinct texts; panes scroll independently.
- **AC-6** All controls are keyboard-accessible and panes are labeled for screen readers.
- **AC-7** Exiting Compare returns to the normal reading view; a passage with <2 texts shows Compare disabled.

---

## 9. Secondary — Arrangement comparison (Phase 2, book-level)

A distinct mode for comparing two **orderings** of the whole book (not texts).

- **AR-1** From `/arrangements`, a reader can pick **two** arrangements to compare.
- **AR-2** Two columns, each showing that arrangement's **movements → passages** outline in its own order (passage title + canonical ref).
- **AR-3** Optional gentle linking: hovering/focusing a passage in one column highlights the **same passage** wherever it sits in the other column — to reveal how the orderings differ. **No forced row alignment** (the orderings differ by nature; that is the point).
- **AR-4** Neutral, equal presentation — never "which order is right."
- **AR-5** Responsive: stacked or segmented on narrow screens.
- **AR-6** Out of scope: merging arrangements, auto-computing an "ordering diff" score.

---

## 10. Claude Code kickoff prompt (paste to build passage comparison)

> Add a **Comparison Mode** to passage pages on The Unsealed Revelation. Read `comparison-mode-requirements.md` first; it is the source of truth, and note §0: **comparison is parallel reading, NOT a diff** — never align verses or compute word-level differences between distinct texts. Keep existing values: reverent, never ranked, mobile-first, grounded.
>
> Build passage comparison per FR-1 through FR-8: a Compare toggle on each passage page; two independent panes, each with a picker over {traditional KJV, gathered rendering, every published rendering}; default left=Traditional, right=Gathered; a swap-sides control; independent scrolling; compact rendering metadata per pane. Encode compare state in the URL query so it's shareable and survives refresh (FR-4). Responsive: two readable columns on wide screens, a segmented A|B switch on narrow screens, no horizontal scroll (FR-5). Full keyboard access and labeled regions (FR-6). Handle the edge cases in FR-7, especially: disable Compare when a passage has fewer than two texts, and gracefully recover when a URL references a removed rendering. Meet the acceptance criteria AC-1..AC-7.
>
> Do not build version-diff, 3-up panes, synced scroll, or arrangement comparison in this pass. Propose your component structure and the URL scheme, wait for my OK, then build. Summarize what changed when done.
