"use client";

import { useEffect } from "react";

// Opens the print dialog once the page (and its webfonts) have loaded, so a
// "Print this…" link lands straight in the dialog. Cancelling leaves the
// print-ready page on screen.
export function AutoPrint() {
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
