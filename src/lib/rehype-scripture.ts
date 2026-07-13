import { findReferences } from "@/lib/scripture";

// A rehype plugin that turns scripture references in text into Gospel Library
// links (class "scripture-ref" + data attributes the hover reads). Skips text
// already inside links, code, or headings. Runs after sanitize, so its trusted
// nodes survive.

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const SKIP = new Set(["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6"]);

function linkNode(
  ref: ReturnType<typeof findReferences>[number],
): HNode {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["scripture-ref"],
      href: ref.url,
      target: "_blank",
      rel: "noopener noreferrer",
      dataSource: ref.source,
      dataKey: ref.lookupKey,
      dataCh: String(ref.chapter),
      dataV1: ref.verseStart != null ? String(ref.verseStart) : "",
      dataV2: ref.verseEnd != null ? String(ref.verseEnd) : "",
      dataRef: ref.canonicalRef,
    },
    children: [{ type: "text", value: ref.text }],
  };
}

function splitText(value: string): HNode[] | null {
  const refs = findReferences(value);
  if (refs.length === 0) return null;
  const out: HNode[] = [];
  let cursor = 0;
  for (const ref of refs) {
    if (ref.index > cursor) {
      out.push({ type: "text", value: value.slice(cursor, ref.index) });
    }
    out.push(linkNode(ref));
    cursor = ref.index + ref.length;
  }
  if (cursor < value.length) {
    out.push({ type: "text", value: value.slice(cursor) });
  }
  return out;
}

function walk(node: HNode, skipping: boolean): void {
  if (!node.children) return;
  const skipChildren =
    skipping || (node.tagName ? SKIP.has(node.tagName) : false);
  const next: HNode[] = [];
  for (const child of node.children) {
    if (!skipChildren && child.type === "text" && child.value) {
      const parts = splitText(child.value);
      if (parts) {
        next.push(...parts);
        continue;
      }
    }
    if (child.type === "element") walk(child, skipChildren);
    next.push(child);
  }
  node.children = next;
}

export function rehypeScripture() {
  return (tree: HNode) => {
    walk(tree, false);
  };
}
