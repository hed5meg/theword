"use client";

// Opens the browser's print dialog (which also offers "Save as PDF"). The print
// stylesheet in globals.css strips the app chrome and sets the page like a book.
export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`transition-colors hover:text-ink-soft ${className}`}
    >
      Print
    </button>
  );
}
