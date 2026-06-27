// Robust text anchoring for Margin Notes (and later, Refinements).
// All anchoring happens in ONE space: the rendered plain-text (textContent) of
// the rendering container — so a note never lands on the wrong span, and the
// Markdown-vs-text mismatch never bites us.

export interface TextAnchor {
  anchorStart: number;
  anchorEnd: number;
  quotedText: string;
  contextPrefix: string;
  contextSuffix: string;
}

const CONTEXT = 40;

/** Character offsets of a DOM Range within the container's textContent. */
export function rangeToOffsets(
  container: HTMLElement,
  range: Range,
): { start: number; end: number } {
  const pre = range.cloneRange();
  pre.selectNodeContents(container);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  return { start, end };
}

/** Build a full anchor (offsets + quote + surrounding context) from a selection. */
export function computeAnchor(
  container: HTMLElement,
  range: Range,
): TextAnchor | null {
  const text = container.textContent ?? "";
  const { start, end } = rangeToOffsets(container, range);
  if (end <= start) return null;
  const quotedText = text.slice(start, end);
  if (!quotedText.trim()) return null;
  return {
    anchorStart: start,
    anchorEnd: end,
    quotedText,
    contextPrefix: text.slice(Math.max(0, start - CONTEXT), start),
    contextSuffix: text.slice(end, end + CONTEXT),
  };
}

function commonSuffixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}
function commonPrefixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * Find where an anchor sits in the current text. Returns null (orphaned) if the
 * quote is gone or can't be placed unambiguously.
 */
export function reAnchor(
  text: string,
  a: TextAnchor,
): { start: number; end: number } | null {
  // Fast path: still exactly where it was.
  if (text.slice(a.anchorStart, a.anchorEnd) === a.quotedText) {
    return { start: a.anchorStart, end: a.anchorEnd };
  }
  // Search for all occurrences of the quote.
  const idxs: number[] = [];
  let i = text.indexOf(a.quotedText);
  while (i >= 0) {
    idxs.push(i);
    i = text.indexOf(a.quotedText, i + 1);
  }
  if (idxs.length === 0) return null; // gone → orphaned
  if (idxs.length === 1) {
    return { start: idxs[0], end: idxs[0] + a.quotedText.length };
  }
  // Multiple matches → disambiguate by surrounding context.
  let best = -1;
  let bestScore = -1;
  for (const idx of idxs) {
    const pre = text.slice(Math.max(0, idx - CONTEXT), idx);
    const suf = text.slice(idx + a.quotedText.length, idx + a.quotedText.length + CONTEXT);
    const score =
      commonSuffixLen(pre, a.contextPrefix) + commonPrefixLen(suf, a.contextSuffix);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  // Require some context confidence to avoid guessing.
  if (best < 0 || bestScore < 4) return null;
  return { start: best, end: best + a.quotedText.length };
}

/** Convert offsets back to a DOM Range within the container (for highlighting). */
export function offsetsToRange(
  container: HTMLElement,
  start: number,
  end: number,
): Range | null {
  const doc = container.ownerDocument;
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = node.data.length;
    if (!startNode && pos + len >= start) {
      startNode = node;
      startOffset = start - pos;
    }
    if (pos + len >= end) {
      endNode = node;
      endOffset = end - pos;
      break;
    }
    pos += len;
    node = walker.nextNode() as Text | null;
  }
  if (!startNode || !endNode) return null;
  const range = doc.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}
