// Essay cross-linking, as two rehype passes (run after sanitize, like the
// scripture pass, so their trusted output survives):
//   - rehypeAnchors: give headings stable ids from their text, and honor an
//     explicit {#id} at the end of any block (paragraph, heading, list item).
//   - rehypeWikiLinks: turn [[slug#anchor|label]] into a link to that essay,
//     resolving the essay's current title when no label is given.

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const BLOCKS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
]);
const HEADING = /^h[1-6]$/;

export function slugifyText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function textOf(node: HNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

/** The deepest last text-node descendant (where a trailing {#id} would live). */
function lastText(node: HNode): HNode | null {
  const kids = node.children;
  if (!kids || kids.length === 0) return node.type === "text" ? node : null;
  for (let i = kids.length - 1; i >= 0; i--) {
    const t = lastText(kids[i]);
    if (t) return t;
  }
  return null;
}

export function rehypeAnchors() {
  return (tree: HNode) => {
    const used = new Set<string>();
    const assign = (el: HNode, base: string) => {
      let id = base;
      let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
      used.add(id);
      (el.properties ??= {}).id = id;
    };

    const walk = (node: HNode) => {
      for (const child of node.children ?? []) {
        if (child.type === "element" && child.tagName && BLOCKS.has(child.tagName)) {
          // Explicit {#id} at the very end of the block.
          const lt = lastText(child);
          const m = lt?.value?.match(/\s*\{#([\w-]+)\}\s*$/);
          if (lt && m) {
            lt.value = lt.value!.slice(0, m.index).replace(/\s+$/, "");
            assign(child, m[1]);
          } else if (HEADING.test(child.tagName)) {
            const base = slugifyText(textOf(child));
            if (base) assign(child, base);
          }
        }
        if (child.type === "element") walk(child);
      }
    };
    walk(tree);
  };
}

export interface EssayAnchor {
  id: string;
  label: string;
}

/** Linkable anchors in an essay body: headings (auto id) + explicit {#id}. */
export function extractAnchors(body: string): EssayAnchor[] {
  const out: EssayAnchor[] = [];
  const seen = new Set<string>();
  const add = (id: string, label: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ id, label });
  };
  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    const explicit = line.match(/\{#([\w-]+)\}/);
    if (heading) {
      const text = heading[2];
      const ex = text.match(/\s*\{#([\w-]+)\}\s*$/);
      if (ex) {
        add(ex[1], text.slice(0, ex.index).trim());
      } else {
        add(slugifyText(text), text);
      }
    } else if (explicit) {
      const label = line
        .replace(/\{#[\w-]+\}/, "")
        .replace(/[#>*_`[\]]/g, "")
        .trim();
      add(explicit[1], (label.slice(0, 60) || explicit[1]).trim());
    }
  }
  return out;
}

const SKIP = new Set(["a", "code", "pre"]);
const WIKI = /\[\[([^\]\n]+)\]\]/g;

function xref(inner: string, titles: Record<string, string>): HNode {
  const [rawTarget, ...labelParts] = inner.split("|");
  const label = labelParts.join("|").trim() || undefined;
  const target = rawTarget.trim();

  let href: string;
  let fallback: string;
  if (target.startsWith("#")) {
    href = target;
    fallback = target.slice(1);
  } else {
    const [slug, anchor] = target.split("#");
    const s = slug.trim();
    href = `/essays/${s}${anchor ? `#${anchor.trim()}` : ""}`;
    fallback = titles[s] ?? s;
  }
  return {
    type: "element",
    tagName: "a",
    properties: { className: ["essay-xref"], href },
    children: [{ type: "text", value: label ?? fallback }],
  };
}

export function rehypeWikiLinks(titles: Record<string, string>) {
  return (tree: HNode) => {
    const walk = (node: HNode, skip: boolean) => {
      if (!node.children) return;
      const skipHere = skip || (node.tagName ? SKIP.has(node.tagName) : false);
      const next: HNode[] = [];
      for (const child of node.children) {
        if (!skipHere && child.type === "text" && child.value?.includes("[[")) {
          const value = child.value;
          let cursor = 0;
          let m: RegExpExecArray | null;
          WIKI.lastIndex = 0;
          let any = false;
          while ((m = WIKI.exec(value)) !== null) {
            any = true;
            if (m.index > cursor) {
              next.push({ type: "text", value: value.slice(cursor, m.index) });
            }
            next.push(xref(m[1], titles));
            cursor = m.index + m[0].length;
          }
          if (any) {
            if (cursor < value.length) {
              next.push({ type: "text", value: value.slice(cursor) });
            }
            continue;
          }
        }
        if (child.type === "element") walk(child, skipHere);
        next.push(child);
      }
      node.children = next;
    };
    walk(tree, false);
  };
}
