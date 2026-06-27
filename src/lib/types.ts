// Domain model for The Unsealed Revelation.
// These shapes are shared by the seed content layer and (later) the Supabase
// data layer, so the reader never needs to know where its content comes from.

export type Role = "member" | "steward" | "admin";

export type RenderingStatus = "draft" | "submitted" | "gathered" | "archived";

export type ResonanceTarget = "rendering" | "tenet" | "reflection";

export type ReflectionTarget = "passage" | "rendering" | "tenet";

export interface Tenet {
  id?: string;
  slug: string;
  title: string;
  /** Plain-language description of the filtering principle. */
  description: string;
  /** Supporting scripture and/or cross-cultural wisdom. */
  support: string;
  /** Optional grouping from the founding library (e.g. "How to Read"). */
  group?: string;
  resonanceCount: number;
}

export interface Rendering {
  id?: string;
  /** Markdown body of the rendering. */
  body: string;
  /** Display name of the contributor (or a seed source name). */
  author: string;
  /** Optional handle linking to a member profile. */
  authorHandle?: string;
  language: string;
  /** Optional tradition the rendering is offered from. */
  tradition?: string;
  status: RenderingStatus;
  /** The tenets this rendering says it filtered through. */
  tenets: Tenet[];
  resonanceCount: number;
  /** True when this is the passage's promoted Gathered Rendering. */
  isGathered: boolean;
}

export interface Passage {
  id?: string;
  slug: string;
  movementSlug: string;
  /** Canonical Revelation reference, e.g. "Rev 12:1-6". */
  canonicalRef: string;
  /** A gentle title for the passage. */
  title: string;
  orderIndex: number;
  /** Public-domain (KJV) anchor text, shown alongside for grounding. */
  traditionalText?: string;
  /** The community's current Gathered Rendering. */
  gatheredRendering: Rendering | null;
  /** All renderings held side by side (includes the gathered one). */
  renderings: Rendering[];
}

export interface Movement {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  orderIndex: number;
  passages: Passage[];
}

// Lightweight shapes for the reader index and navigation (no rendering bodies).
export interface PassageOutline {
  slug: string;
  movementSlug: string;
  canonicalRef: string;
  title: string;
  renderingCount: number;
}

export interface MovementOutline {
  slug: string;
  title: string;
  summary: string;
  passages: PassageOutline[];
}

/** A tenet together with the renderings that read through it. */
export interface TenetUsage {
  passageSlug: string;
  movementSlug: string;
  passageTitle: string;
  canonicalRef: string;
  author: string;
  isGathered: boolean;
}

export interface TenetDetail {
  tenet: Tenet;
  usages: TenetUsage[];
}

export interface NavRef {
  movementSlug: string;
  passageSlug: string;
  title: string;
}

export interface PassageLocation {
  movementSlug: string;
  movementTitle: string;
  passage: Passage;
  previous: NavRef | null;
  next: NavRef | null;
}

export interface BookStats {
  movements: number;
  passages: number;
  renderings: number;
  tenets: number;
}
