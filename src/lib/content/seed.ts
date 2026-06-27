import type { Movement, Passage, Rendering, Tenet } from "@/lib/types";
import { loadContent, type ParsedTenet } from "@/lib/content/parse";

// ---------------------------------------------------------------------------
// Seed mapping
//
// Two renderings of the book live in /content:
//   - the-unsealed-revelation.md   ("The Unsealed Revelation", the fuller telling)
//   - the-unsealed-revelation-vision.md ("A Vision", the plainer, shorter telling)
//
// They do not split into identical sections, so we map BOTH onto one shared set
// of canonical Passages (keyed to a Revelation reference). Where both tellings
// reach the same passage, it holds two renderings side by side. The fuller
// telling is seeded as the initial Gathered Rendering — a gentle, revisable
// steward choice, never a ranking.
// ---------------------------------------------------------------------------

const FULL_SOURCE = "The Unsealed Revelation";
const VISION_SOURCE = "A Vision";

interface MovementDef {
  slug: string;
  title: string;
  summary: string;
}

interface PassageDef {
  /** slug of the section in the fuller telling (also the passage slug) */
  full: string;
  /** slug of the matching section in "A Vision", if it reaches this passage */
  vision?: string;
  movement: string;
  canonicalRef: string;
  /**
   * Optional short KJV anchor — a fallback only. The full public-domain KJV for
   * each reference is loaded from content/kjv-passages.json (the source of truth
   * for traditional text); see content/unsealed-revelation-passage-map.md for
   * the authoritative passage→reference mapping.
   */
  kjv?: string;
  /** Founding tenets this passage is read through (by exact title). */
  tenets: string[];
}

const MOVEMENTS: MovementDef[] = [
  {
    slug: "the-opening-of-the-veil",
    title: "The Opening of the Veil",
    summary:
      "A letter from home, and the only thing fear could never say: do not be afraid.",
  },
  {
    slug: "the-mother-and-the-dragon",
    title: "The Mother and the Dragon",
    summary:
      "Why we came down into the dark, and the accuser who could not stop the birth.",
  },
  {
    slug: "the-long-road-home",
    title: "The Long Road Home",
    summary:
      "The family learning, life by life, to see — and to remember who they are.",
  },
  {
    slug: "the-throne-and-the-scroll",
    title: "The Throne and the Scroll",
    summary:
      "The center of heaven, where mercy is wrapped around all power like a rainbow.",
  },
  {
    slug: "the-great-waking",
    title: "The Great Waking",
    summary:
      "The warnings that wake but never destroy — an alarm clock, not an executioner.",
  },
  {
    slug: "the-beast-and-babylon",
    title: "The Beast and Babylon",
    summary:
      "The frightened animal within, loved into a lamb; and the system that falls when we come out of her.",
  },
  {
    slug: "the-homecoming",
    title: "The Homecoming",
    summary:
      "The marriage, death undone, and heaven coming down to live with us at last.",
  },
];

const PASSAGES: PassageDef[] = [
  {
    full: "a-word-before-the-book",
    vision: "do-not-be-afraid",
    movement: "the-opening-of-the-veil",
    canonicalRef: "Rev 1:1-20",
    tenets: [
      "God is love, and love has no wrath",
      "Christ is the Word",
      "The book is meant to be unsealed",
    ],
  },
  {
    full: "the-mother",
    vision: "the-mother",
    movement: "the-mother-and-the-dragon",
    canonicalRef: "Rev 12:1-6",
    kjv: "And there appeared a great wonder in heaven; a woman clothed with the sun, and the moon under her feet, and upon her head a crown of twelve stars.",
    tenets: [
      "God is Father and Mother",
      "We are children of God, becoming like Him",
      "The three loves",
    ],
  },
  {
    full: "the-war-in-heaven",
    vision: "the-dragon-cast-down",
    movement: "the-mother-and-the-dragon",
    canonicalRef: "Rev 12:7-17",
    kjv: "And there was war in heaven… And I heard a loud voice saying in heaven, Now is come salvation, and strength, and the kingdom of our God… for the accuser of our brethren is cast down… And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death.",
    tenets: [
      "The enemy is never a people",
      "The whole family is one — living and dead, every nation and tongue",
      "Salvation is remembering who we are",
    ],
  },
  {
    full: "the-first-parents-learn-to-see",
    vision: "the-first-parents-the-promise-that-you-can-become-like-god",
    movement: "the-long-road-home",
    canonicalRef: "Rev 3:14-22",
    kjv: "Because thou sayest, I am rich, and increased with goods, and have need of nothing; and knowest not that thou art wretched, and miserable, and poor, and blind, and naked… Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.",
    tenets: [
      "Charity is every attribute of God held in harmony",
      "We are children of God, becoming like Him",
      "Salvation is remembering who we are",
    ],
  },
  {
    full: "the-city-that-remembered-early",
    vision: "the-city-that-remembered-early-the-promise-of-zion",
    movement: "the-long-road-home",
    canonicalRef: "Rev 3:7-13",
    kjv: "I know thy works: behold, I have set before thee an open door, and no man can shut it: for thou hast a little strength, and hast kept my word… Him that overcometh will I make a pillar in the temple of my God… and I will write upon him the name of my God, and the name of the city of my God, which is new Jerusalem.",
    tenets: [
      "Salvation is remembering who we are",
      "The work is to gather all into one",
      "We are children of God, becoming like Him",
    ],
  },
  {
    full: "the-ones-sent-to-wake-us",
    vision: "the-man-who-built-the-boat-the-promise-of-preservation",
    movement: "the-long-road-home",
    canonicalRef: "Rev 3:1-6",
    kjv: "I know thy works, that thou hast a name that thou livest, and art dead. Be watchful, and strengthen the things which remain, that are ready to die.",
    tenets: [
      "You cannot frighten anyone into love",
      "Calamity is consequence, not God's wrath",
      "Salvation is remembering who we are",
    ],
  },
  {
    full: "the-friend-of-god",
    vision: "the-friend-of-god-the-promise-of-a-family-as-countless-as-the-stars",
    movement: "the-long-road-home",
    canonicalRef: "Rev 2:18-29",
    tenets: [
      "The whole family is one — living and dead, every nation and tongue",
      "We are children of God, becoming like Him",
    ],
  },
  {
    full: "the-open-heart",
    vision: "the-king-who-opened-his-heart-the-promise-of-an-everlasting-house",
    movement: "the-long-road-home",
    canonicalRef: "Rev 2:12-17",
    tenets: [
      "Charity is every attribute of God held in harmony",
      "The three loves",
    ],
  },
  {
    full: "the-witnesses",
    vision: "the-witnesses-the-promise-of-resurrection",
    movement: "the-long-road-home",
    canonicalRef: "Rev 2:8-11",
    tenets: ["Christ is the Word", "God is love, and love has no wrath"],
  },
  {
    full: "the-harvest-today",
    vision: "today-the-promise-of-the-gathering-and-the-tree-of-life",
    movement: "the-long-road-home",
    canonicalRef: "Rev 2:1-7",
    tenets: [
      "The tares are lies, not people",
      "The work is to gather all into one",
      "You cannot frighten anyone into love",
    ],
  },
  {
    full: "the-throne-and-the-sealed-word",
    vision: "the-throne-and-the-sealed-word",
    movement: "the-throne-and-the-scroll",
    canonicalRef: "Rev 4:1-5:14",
    kjv: "And, behold, a throne was set in heaven, and one sat on the throne… and there was a rainbow round about the throne, in sight like unto an emerald… Weep not: behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book, and to loose the seven seals thereof.",
    tenets: [
      "God's power flows through His promise",
      "Christ is the Word",
      "Charity is every attribute of God held in harmony",
    ],
  },
  {
    full: "the-seals-what-the-light-reveals",
    vision: "what-the-light-reveals-and-who-can-stand",
    movement: "the-throne-and-the-scroll",
    canonicalRef: "Rev 6:1-17",
    kjv: "And said to the mountains and rocks, Fall on us, and hide us from the face of him that sitteth on the throne, and from the wrath of the Lamb: For the great day of his wrath is come; and who shall be able to stand?",
    tenets: [
      "God is love, and love has no wrath",
      "Calamity is consequence, not God's wrath",
    ],
  },
  {
    full: "the-ones-who-stand",
    movement: "the-throne-and-the-scroll",
    canonicalRef: "Rev 7:1-17",
    kjv: "After this I beheld, and, lo, a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb… and God shall wipe away all tears from their eyes.",
    tenets: [
      "Gather every truth from every people",
      "The whole family is one — living and dead, every nation and tongue",
    ],
  },
  {
    full: "the-trumpets-the-great-waking",
    vision: "the-waking-and-the-emptying-of-the-cup",
    movement: "the-great-waking",
    canonicalRef: "Rev 8:1-9:21",
    kjv: "And when he had opened the seventh seal, there was silence in heaven about the space of half an hour… And the rest of the men which were not killed by these plagues yet repented not of the works of their hands.",
    tenets: [
      "Calamity is consequence, not God's wrath",
      "You cannot frighten anyone into love",
    ],
  },
  {
    // NEW passage (Rev 10) — the trumpet-interlude, placed right after Trumpets.
    full: "the-open-book-and-the-sealed-thunder",
    movement: "the-great-waking",
    canonicalRef: "Rev 10:1-11",
    tenets: ["The book is meant to be unsealed", "Christ is the Word"],
  },
  {
    full: "the-two-who-stand-together",
    vision: "the-two-who-stand-together",
    movement: "the-great-waking",
    canonicalRef: "Rev 11:1-19",
    tenets: [
      "The whole family is one — living and dead, every nation and tongue",
      "Christ is the Word",
    ],
  },
  {
    full: "the-whole-earth-remembers",
    vision: "the-whole-earth-remembers",
    movement: "the-great-waking",
    canonicalRef: "Rev 14:1-20",
    tenets: [
      "The work is to gather all into one",
      "Gather every truth from every people",
    ],
  },
  {
    full: "the-beast-within",
    vision: "the-beast",
    movement: "the-beast-and-babylon",
    canonicalRef: "Rev 13:1-18",
    kjv: "And I stood upon the sand of the sea, and saw a beast rise up out of the sea… Here is wisdom. Let him that hath understanding count the number of the beast: for it is the number of a man; and his number is Six hundred threescore and six.",
    tenets: [
      "The beast is within — love it into a lamb, do not destroy it",
      "The enemy is never a people",
      "Salvation is remembering who we are",
    ],
  },
  {
    full: "the-bowls-emptying-the-cup",
    movement: "the-beast-and-babylon",
    canonicalRef: "Rev 15:1-16:21",
    tenets: [
      "Calamity is consequence, not God's wrath",
      "God is love, and love has no wrath",
    ],
  },
  {
    full: "babylon-the-false-bride-falls",
    vision: "babylon-the-false-bride",
    movement: "the-beast-and-babylon",
    canonicalRef: "Rev 17:1-18:24",
    kjv: "Come out of her, my people, that ye be not partakers of her sins, and that ye receive not of her plagues… the merchandise of… slaves, and souls of men.",
    tenets: [
      "Babylon is a system, never a people",
      "The enemy is never a people",
    ],
  },
  {
    full: "the-marriage-of-the-lamb",
    vision: "the-marriage",
    movement: "the-homecoming",
    canonicalRef: "Rev 19:1-21",
    kjv: "Let us be glad and rejoice, and give honour to him: for the marriage of the Lamb is come, and his wife hath made herself ready… and his name is called The Word of God.",
    tenets: [
      "Christ is the Word",
      "God is Father and Mother",
      "The work is to gather all into one",
    ],
  },
  {
    full: "the-dragon-bound-and-death-undone",
    vision: "the-end-of-the-dragon-and-the-end-of-death",
    movement: "the-homecoming",
    canonicalRef: "Rev 20:1-15",
    kjv: "And death and hell were cast into the lake of fire. This is the second death… And whosoever was not found written in the book of life was cast into the lake of fire.",
    tenets: [
      "God is love, and love has no wrath",
      "Salvation is remembering who we are",
    ],
  },
  {
    full: "the-city-home",
    vision: "home",
    movement: "the-homecoming",
    canonicalRef: "Rev 21:1-22:21",
    kjv: "Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people… And God shall wipe away all tears from their eyes; and there shall be no more death… Seal not the sayings of the prophecy of this book: for the time is at hand.",
    tenets: [
      "Heaven comes down — His coming is a homecoming",
      "Gather every truth from every people",
      "Nothing is final",
      "The book is meant to be unsealed",
    ],
  },
];

function toTenet(parsed: ParsedTenet): Tenet {
  return { ...parsed, resonanceCount: 0 };
}

/** Resolve the founding tenets into a slug + title index. */
async function tenetIndex(): Promise<{
  list: Tenet[];
  bySlug: Map<string, Tenet>;
  byTitle: Map<string, Tenet>;
}> {
  const { tenets } = await loadContent();
  const list = tenets.map(toTenet);
  return {
    list,
    bySlug: new Map(list.map((t) => [t.slug, t])),
    byTitle: new Map(list.map((t) => [t.title, t])),
  };
}

export async function buildTenets(): Promise<Tenet[]> {
  return (await tenetIndex()).list;
}

export async function buildBook(): Promise<Movement[]> {
  const { full, vision, kjvByRef } = await loadContent();
  const { byTitle } = await tenetIndex();

  const movementMap = new Map<string, Movement>(
    MOVEMENTS.map((m, i) => [
      m.slug,
      { slug: m.slug, title: m.title, summary: m.summary, orderIndex: i, passages: [] },
    ]),
  );

  PASSAGES.forEach((def, index) => {
    const fullSection = full.get(def.full);
    if (!fullSection) {
      throw new Error(`Seed: missing section "${def.full}" in the fuller telling`);
    }
    const visionSection = def.vision ? vision.get(def.vision) : undefined;
    if (def.vision && !visionSection) {
      throw new Error(`Seed: missing section "${def.vision}" in A Vision`);
    }

    const tenets = def.tenets.map((title) => {
      const t = byTitle.get(title);
      if (!t) throw new Error(`Seed: unknown tenet "${title}"`);
      return t;
    });

    const gathered: Rendering = {
      id: `${def.full}--full`,
      body: fullSection.body,
      author: FULL_SOURCE,
      language: "English",
      status: "gathered",
      tenets,
      resonanceCount: 0,
      isGathered: true,
    };

    const renderings: Rendering[] = [gathered];
    if (visionSection) {
      renderings.push({
        id: `${def.full}--vision`,
        body: visionSection.body,
        author: VISION_SOURCE,
        language: "English",
        status: "submitted",
        tenets,
        resonanceCount: 0,
        isGathered: false,
      });
    }

    const movement = movementMap.get(def.movement);
    if (!movement) throw new Error(`Seed: unknown movement "${def.movement}"`);

    const passage: Passage = {
      slug: def.full,
      movementSlug: def.movement,
      canonicalRef: def.canonicalRef,
      title: fullSection.heading,
      orderIndex: index,
      // Full public-domain KJV for the reference, with the anchor as a fallback.
      traditionalText: kjvByRef[def.canonicalRef] ?? def.kjv,
      gatheredRendering: gathered,
      renderings,
    };
    movement.passages.push(passage);
  });

  return [...movementMap.values()].sort((a, b) => a.orderIndex - b.orderIndex);
}
