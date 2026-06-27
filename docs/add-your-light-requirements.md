# Requirements — "Add your light" CTA + page-lightening bloom

Reference implementation: `add-your-light-prototype.html` (open it, click the
button, use the tuning panel to pick intensity/duration, then set the final
values below). This spec describes how to bring it into the real site.

## Prompt for Claude Code

> Two linked changes to the "Add your light" call-to-action:
> 1. **Make the CTA pop.** Promote it from a plain nav link to a gold pill button
>    with a soft, slowly "breathing" glow that draws the eye, plus a hover lift.
> 2. **Add a light-bloom on activation.** When the CTA is clicked, a warm light
>    blooms outward from the button and the whole page visibly brightens for ~1
>    second, then settles. It should read as the page filling with light.
>
> Build it with the existing tokens (`gold-soft`, `ink`, `paper/bg`, `line`),
> support light and dark, and follow the accessibility rules in §4 exactly —
> this effect touches photosensitivity territory, so the reduced-motion path is
> mandatory, not optional.

## 1. The CTA

- Gold pill: `background: gold`, dark gold-ink text for contrast
  (`#3A2A08` light / `#2A1E06` dark — both clear AA on gold), pill radius,
  a leading `✦`.
- **Ambient "breathe":** a slow (~3.2s) box-shadow glow pulse so it gently calls
  attention without spinning or bouncing. Disable under reduced motion.
- **Hover:** lift 1px, deepen the gold, expand the glow; nudge/rotate the `✦`.
- **Focus-visible:** a clear gold outline with offset (keyboard users must see it).
- Keep one primary instance. Optionally echo it as a centered hero CTA (the
  prototype shows both) so the bloom can originate from page center.

## 2. The bloom

- A full-viewport overlay (`position: fixed; inset:0; pointer-events:none;
  z-index above content`) combining a **warm gold radial flare** centered on the
  click origin **with a faint flat full-page warm wash** layered behind it.
  Capture the button's center (or click x/y) into CSS vars `--x/--y` so the flare
  emanates from where the user "added" it.
- Animate it as a **quick eased flare** (opacity 0 → peak over the first ~12% of
  the duration) **then a linear fade** (peak → 0 over the remaining time). The
  linear fade matters: a single hard ease-out across the whole animation collapses
  the visible light into the first ~150 ms and spends the rest in an invisible
  tail, which makes the duration setting do nothing perceptible. Use per-keyframe
  easing (eased rise, `linear` fall), not one global ease-out. In parallel, lift
  the page wrapper's `filter: brightness(1 → 1+lift → 1)` on the same timing so
  existing content actually brightens.
- **Use gold, not white.** The light page is already near-white (`#FAF8F4`), so a
  white bloom has almost no contrast headroom and reads as nothing — the intensity
  and brightness controls look broken even when firing. A warm gold flare contrasts
  against cream and reads as light. The flat wash is what makes the *whole* page
  visibly lift (a corner-only radial is easy to miss). On dark it glows like a
  lantern flaring; on light it warms the cream.
- Use the Web Animations API (as in the prototype) so intensity/duration/lift are
  parameters, not hardcoded keyframes.

### Final values (locked)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Peak opacity (`intensity`) | `0.50` | overlay peak |
| Duration | `1,500 ms` | quick flare + linear fade |
| Brightness lift | `0.30` | `brightness(1.30)` at peak |
| Origin | **page center** | bloom emanates from viewport center, not the button |

These are the agreed values — implement with them. The presets below are kept
only for reference (the locked 1,500 ms sits between Standard and Lingering):

| Reference preset | Peak | Duration | Lift |
|--------|------|----------|------|
| Lingering | 0.78 | 1,800 ms | 0.14 |
| Benediction | 0.85 | 2,200 ms | 0.18 |
| Dawn | 0.68 | 2,600 ms | 0.11 |
| Vigil | 0.58 | 3,000 ms | 0.09 |

## 3. Token mapping

| Effect element | Token |
|----------------|-------|
| Pill fill / glow color | `gold-soft` |
| Pill text | dark gold-ink (`#3A2A08` / `#2A1E06`) |
| Bloom flare core | warm gold — `rgba(255,252,244)`→`rgba(250,205,125,0)` light / `rgba(255,248,224)`→`rgba(240,180,90,0)` dark |
| Bloom flat wash | `rgba(255,238,196,~.55)` light / `rgba(255,224,150,~.30)` dark |
| Card hover wash | `gold-soft` at low alpha (already used as `glow`) |

## 4. Accessibility (required)

- **Photosensitivity / WCAG 2.3.1:** keep it to **one** smooth flash — never a
  repeating or strobing pulse. A single ~1s rise-and-fall is within guidance; do
  not chain or auto-repeat it.
- **`prefers-reduced-motion: reduce`:** replace the bloom with a brief, low-peak
  (~0.18 opacity), ~600ms fade and **no brightness spike**; also stop the CTA's
  ambient breathe. The prototype's `prefersReduced()` branch shows this.
- **Keyboard:** the CTA is a real `<button>`/`<a>`, focusable, with a visible
  focus ring; the effect must trigger on keyboard activation too.
- **Non-blocking:** the overlay is `pointer-events:none` and must never trap focus
  or delay navigation — the underlying action (sign in / add a rendering) should
  proceed normally while the bloom plays.

## 5. Acceptance checklist

- [ ] CTA is visibly a button that draws the eye at rest (breathing glow) without
      being distracting; hover and focus states are clear.
- [ ] Clicking triggers a single warm bloom from the button; the page brightens
      for ~1s then returns to normal exactly once.
- [ ] Works in both light and dark themes; bloom reads correctly on each.
- [ ] Reduced-motion users get the gentle fade, no spike, no breathing pulse.
- [ ] Effect never blocks the click's real action or steals focus.
- [ ] Final intensity/duration/lift values are recorded (from the tuner) and
      match what ships.

## 6. Note

The tuning panel in the prototype is **demo scaffolding only** — don't port it.
It exists so you can choose the four numbers above.
