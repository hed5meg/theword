# Requirements — Contrast + Dark Mode for `theword.love` (mapped to real tokens)

Mapped to the site's actual design tokens, read from the live `/read` source:
`ink` · `ink-soft` · `ink-faint` · `gold-soft` · `card` · `glow` · `line`.
Fonts (EB Garamond serif + Inter for `.ui`) stay as-is.

## Prompt for Claude Code

> Two changes: (1) raise text contrast in the current (light) theme — the small
> `ink-faint` text is hard to read — and (2) add a dark mode. The site already
> uses semantic Tailwind tokens (`text-ink`, `text-ink-soft`, `text-ink-faint`,
> `text-gold-soft`, `bg-card`, `bg-glow`, `border-line`), so this is mostly a
> matter of (a) retuning the light values and (b) defining a dark set for the
> same tokens behind a theme switch.
>
> 1. In the theme config, treat each token as theme-aware (CSS variables that swap
>    on `.dark` / `[data-theme="dark"]`). Don't introduce new hardcoded colors in
>    components.
> 2. Light values → §3. Dark values → §4. All values are contrast-verified.
> 3. Add theme switching per §5 (system default + toggle + no flash).
> 4. Verify against §6 and report a diff.

## 1. The contrast problem

`ink-faint` is used for the verse references (`Rev 1:1-20`) and the
"N renderings" counts — small, uppercase, letter-spaced text where low contrast
hurts most. Raising it is the core fix. `ink` (body/headings) is already strong;
`ink-soft` (descriptions, nav) is acceptable but nudged for margin.

## 2. Standards

- Primary text (`ink`): AAA (≥ 7:1).
- Secondary (`ink-soft`) and small muted (`ink-faint`): AA minimum (≥ 4.5:1) — and
  `ink-faint` should stay visibly lighter than `ink-soft` so the hierarchy holds.
- Decorative (`gold-soft` ✦, `line` borders): ≥ 3:1, non-text rule.
- No pure black on white; no pure-black dark background.

## 3. Light theme values (on paper `#FAF8F4`, card `#FFFFFF`)

| Token | Current | New value | Ratio vs paper | Level |
|-------|---------|-----------|----------------|-------|
| page bg (`paper`/base) | — | `#FAF8F4` | — | — |
| `card` | — | `#FFFFFF` | — | — |
| `ink` | keep | `#2B2A28` | **13.52** | AAA |
| `ink-soft` | (low) | `#5C574E` | **6.76** | AA / AAA-large |
| `ink-faint` | **too light** | `#6E685C` | **5.21** | AA / AAA-large |
| `gold-soft` | keep | existing gold | decorative ≥3:1 | — |
| `line` | keep/slightly darker | `#E0D9CC` | hairline | — |

`ink` on white `card` = **14.34** (AAA). The only required change for the comfort
complaint is `ink-faint`; `ink-soft` is a small bump for headroom.

## 4. Dark theme values (on bg `#17150F`, card `#211E18`)

| Token | Value | Ratio vs bg | Level |
|-------|-------|-------------|-------|
| page bg (`paper`/base) | `#17150F` (warm near-black) | — | — |
| `card` | `#211E18` | — | — |
| `ink` | `#ECE7DE` (warm off-white) | **14.82** | AAA |
| `ink-soft` | `#C9C2B5` | **10.31** | AAA |
| `ink-faint` | `#A39C8E` | **6.70** | AA / AAA-large |
| `gold-soft` | `#E8B04B` (amber) | **9.34** | AAA |
| `glow` (hover bg) | `#2A251D` | — | keep text ≥ thresholds on hover |
| `line` | `#332E26` | hairline | — |

`ink` on `card` = **13.49** (AAA). Off-white text (not `#FFF`) and warm near-black
bg (not `#000`) are deliberate — they cut glare/halation for long reading.

> **Links:** passage links currently render in `ink` with a hover background
> (`hover:bg-glow`), so there's no separate link color to fix. If you ever want
> inline links to read *as* links, add a `link` token — `#8A1C3B` (deep rose,
> 8.57:1) in light, `#E89BB0` (soft rose, 8.47:1) in dark — rather than coloring
> links gold (gold on cream fails contrast).

## 5. Theme switching behavior

1. **Default to system** via `prefers-color-scheme`; set `color-scheme: light dark`
   on `:root`.
2. **Toggle** in the header `nav` (next to Read / Principles). Ideal three-state
   *System · Light · Dark*; two-state is fine.
3. **Persist** the choice; on return honor it, and if "System," keep tracking the OS.
4. **No flash:** inline a tiny `<head>` script that sets `.dark` /
   `data-theme` on `<html>` before first paint. (This is a Next.js App Router app —
   put it in the root layout `<head>`, before hydration, e.g. a blocking inline
   script or a library like `next-themes`.)
5. **Accessible toggle:** real `<button>`, `aria-label`, reflects state, keyboard
   operable, visible focus ring; respect `prefers-reduced-motion` if you animate.
6. Set `<meta name="theme-color">` per theme.

## 6. Acceptance checklist

- [ ] `ink-faint` verse refs and counts are comfortably readable in both themes
      (≥ 4.5:1) while still clearly subordinate to `ink`.
- [ ] `ink` ≥ 7:1 in both themes; `ink-soft` ≥ 4.5:1 in both.
- [ ] Toggle swaps page bg, `card`, all three `ink` tiers, `gold-soft`, `glow`,
      and `line` together — nothing stranded.
- [ ] No pure black/white extremes remain.
- [ ] Reload preserves theme; no flash of wrong theme; "System" tracks OS live.
- [ ] Toggle is keyboard-reachable, labeled, focus-ringed.
- [ ] Check the passage-list cards and their `hover:bg-glow` state in dark mode —
      text contrast must hold on hover.
- [ ] Report which token definitions changed and confirm no component hardcodes
      a color outside the token system.

## 7. Notes

- Ratios computed with the WCAG relative-luminance formula; re-verify any pair if
  you shift a hue.
- This keeps the warm, candlelit aesthetic intentionally — dark mode is warm
  charcoal, not stark black.
