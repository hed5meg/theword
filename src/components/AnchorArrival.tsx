"use client";

import { useEffect } from "react";

/**
 * When you arrive on (or navigate to) a #anchor, gently scroll it into view and
 * pulse a highlight so the referenced paragraph is easy to find. Honors
 * reduced-motion for the scroll.
 */
export function AnchorArrival() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function go() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
      el.classList.add("xref-target");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("xref-target"), 2400);
    }

    // Defer once so layout is settled after hydration.
    const raf = requestAnimationFrame(go);
    window.addEventListener("hashchange", go);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", go);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
