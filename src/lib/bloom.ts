// The "add your light" bloom: a warm gold flare from page center + a brief
// page-brightness lift. One smooth, non-repeating flash; honors reduced motion.
// Shared by the hero CTA and the resonance ("add your light") control.

const PEAK = 0.5;
const DURATION = 1500;
const LIFT = 0.3;
const RM_PEAK = 0.18;
const RM_DURATION = 600;

export function playBloom() {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark = document.documentElement.classList.contains("dark");

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0;";
  const flare = dark
    ? "rgba(255,248,224,1) 0%, rgba(240,180,90,0) 60%"
    : "rgba(255,252,244,1) 0%, rgba(250,205,125,0) 60%";
  const wash = dark ? "rgba(255,224,150,0.30)" : "rgba(255,238,196,0.55)";
  overlay.style.background = `radial-gradient(circle at 50% 50%, ${flare}), ${wash}`;
  document.body.appendChild(overlay);

  const peak = reduced ? RM_PEAK : PEAK;
  const duration = reduced ? RM_DURATION : DURATION;

  const anim = overlay.animate(
    [
      { opacity: 0, easing: "ease-out", offset: 0 },
      { opacity: peak, offset: 0.12 },
      { opacity: 0, easing: "linear", offset: 1 },
    ],
    { duration, fill: "none" },
  );
  anim.finished.then(() => overlay.remove()).catch(() => overlay.remove());

  if (!reduced) {
    const page = document.getElementById("page");
    page?.animate(
      [
        { filter: "brightness(1)", easing: "ease-out", offset: 0 },
        { filter: `brightness(${1 + LIFT})`, offset: 0.12 },
        { filter: "brightness(1)", offset: 1, easing: "linear" },
      ],
      { duration },
    );
  }
}
