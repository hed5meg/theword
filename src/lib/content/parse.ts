import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const DOCS_DIR = path.join(process.cwd(), "docs");

export interface Section {
  heading: string;
  slug: string;
  body: string;
}

export interface ParsedTenet {
  slug: string;
  title: string;
  description: string;
  support: string;
  group?: string;
}

/** Gentle, URL-safe slug. "The Harvest — Today" -> "the-harvest-today". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/['’]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripEmphasis(line: string): string {
  return line.replace(/^\*+|\*+$/g, "").trim();
}

async function read(dir: string, file: string): Promise<string> {
  return fs.readFile(path.join(dir, file), "utf8");
}

/**
 * Split a markdown document into ordered sections at the given heading level
 * (2 = "## ", 3 = "### "). Body text is collected until the next heading of the
 * same or a higher level. Horizontal rules ("---") are dropped.
 */
function splitSections(markdown: string, level: 2 | 3): Section[] {
  const marker = "#".repeat(level) + " ";
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: { heading: string; body: string[] } | null = null;

  const isBreakHeading = (line: string) => {
    // A heading at this level or shallower ends the current section.
    const m = /^(#{1,6})\s/.exec(line);
    return m !== null && m[1].length <= level;
  };

  for (const raw of lines) {
    if (raw.startsWith(marker)) {
      if (current) sections.push(finalize(current));
      current = { heading: raw.slice(marker.length).trim(), body: [] };
      continue;
    }
    if (current) {
      if (isBreakHeading(raw)) {
        // A shallower heading (e.g. a new "# ") closes the current section.
        sections.push(finalize(current));
        current = null;
        continue;
      }
      if (raw.trim() === "---") continue;
      current.body.push(raw);
    }
  }
  if (current) sections.push(finalize(current));
  return sections;
}

function finalize(current: { heading: string; body: string[] }): Section {
  return {
    heading: current.heading,
    slug: slugify(current.heading),
    body: current.body.join("\n").trim(),
  };
}

/** Build a slug -> Section map for stable lookup independent of punctuation. */
function bySlug(sections: Section[]): Map<string, Section> {
  return new Map(sections.map((s) => [s.slug, s]));
}

let cache: {
  full: Map<string, Section>;
  vision: Map<string, Section>;
  tenets: ParsedTenet[];
  mission: string;
  kjvByRef: Record<string, string>;
} | null = null;

export async function loadContent() {
  if (cache) return cache;

  const [fullRaw, visionRaw, tenetsRaw, missionRaw, kjvByRef] = await Promise.all([
    read(CONTENT_DIR, "the-unsealed-revelation.md"),
    read(CONTENT_DIR, "the-unsealed-revelation-vision.md"),
    read(DOCS_DIR, "unsealed-revelation-seed-tenets.md"),
    read(CONTENT_DIR, "the-word-mission.md"),
    readJson(CONTENT_DIR, "kjv-passages.json"),
  ]);

  cache = {
    full: bySlug(splitSections(fullRaw, 2)),
    vision: bySlug(splitSections(visionRaw, 3)),
    tenets: parseTenets(tenetsRaw),
    mission: missionRaw.trim(),
    kjvByRef,
  };
  return cache;
}

/** Read a JSON content file, returning {} if it isn't present. */
async function readJson(dir: string, file: string): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
  } catch {
    return {};
  }
}

/**
 * Parse the founding tenets library. Format per tenet:
 *   ## Group
 *   ### Title
 *   <description paragraph(s)>
 *   *Support: ...*
 */
function parseTenets(markdown: string): ParsedTenet[] {
  const lines = markdown.split("\n");
  const tenets: ParsedTenet[] = [];
  let group: string | undefined;
  let current: { title: string; description: string[]; support: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    tenets.push({
      slug: slugify(current.title),
      title: current.title,
      description: current.description.join("\n").trim(),
      support: current.support.join(" ").trim(),
      group,
    });
    current = null;
  };

  for (const raw of lines) {
    if (raw.startsWith("## ")) {
      flush();
      group = raw.slice(3).trim();
      continue;
    }
    if (raw.startsWith("### ")) {
      flush();
      current = { title: raw.slice(4).trim(), description: [], support: [] };
      continue;
    }
    if (!current) continue;
    if (raw.trim() === "---") continue;
    const trimmed = raw.trim();
    if (/^\*support:/i.test(trimmed)) {
      current.support.push(stripEmphasis(trimmed).replace(/^Support:\s*/i, ""));
    } else if (trimmed.length > 0) {
      current.description.push(trimmed);
    }
  }
  flush();
  return tenets;
}
