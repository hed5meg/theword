// Detect scripture references in prose and turn them into Gospel Library links.
// Covers the standard works: Bible (OT/NT), Book of Mormon, Doctrine and
// Covenants, and the Pearl of Great Price, including common abbreviations.
//
// Book names are matched case-sensitively (references are written capitalized),
// and only when followed by a chapter number, to avoid catching ordinary words
// like "job" or "mark".

export interface BookDef {
  /** Canonical display name. */
  canonical: string;
  /** Gospel Library volume + book slug. */
  vol: string;
  slug: string;
  /** Where verse text comes from. */
  source: "bible" | "lds";
  /** Dataset key prefix for LDS books; canonical name for Bible (bible-api). */
  lookupKey: string;
  /** Written forms to match (canonical is added automatically). */
  aliases: string[];
}

// prettier-ignore
const BOOKS: BookDef[] = [
  // Old Testament
  b("Genesis","ot","gen","Genesis",["Gen"]),
  b("Exodus","ot","ex","Exodus",["Ex","Exod"]),
  b("Leviticus","ot","lev","Leviticus",["Lev"]),
  b("Numbers","ot","num","Numbers",["Num"]),
  b("Deuteronomy","ot","deut","Deuteronomy",["Deut"]),
  b("Joshua","ot","josh","Joshua",["Josh"]),
  b("Judges","ot","judg","Judges",["Judg"]),
  b("Ruth","ot","ruth","Ruth",[]),
  b("1 Samuel","ot","1-sam","1 Samuel",["1 Sam","1 Sm"]),
  b("2 Samuel","ot","2-sam","2 Samuel",["2 Sam","2 Sm"]),
  b("1 Kings","ot","1-kgs","1 Kings",["1 Kgs","1 Kg"]),
  b("2 Kings","ot","2-kgs","2 Kings",["2 Kgs","2 Kg"]),
  b("1 Chronicles","ot","1-chr","1 Chronicles",["1 Chr","1 Chron"]),
  b("2 Chronicles","ot","2-chr","2 Chronicles",["2 Chr","2 Chron"]),
  b("Ezra","ot","ezra","Ezra",[]),
  b("Nehemiah","ot","neh","Nehemiah",["Neh"]),
  b("Esther","ot","esth","Esther",["Esth"]),
  b("Job","ot","job","Job",[]),
  b("Psalms","ot","ps","Psalms",["Psalm","Ps","Psa"]),
  b("Proverbs","ot","prov","Proverbs",["Prov"]),
  b("Ecclesiastes","ot","eccl","Ecclesiastes",["Eccl","Eccles"]),
  b("Song of Solomon","ot","song","Song of Solomon",["Song of Sol","Song"]),
  b("Isaiah","ot","isa","Isaiah",["Isa"]),
  b("Jeremiah","ot","jer","Jeremiah",["Jer"]),
  b("Lamentations","ot","lam","Lamentations",["Lam"]),
  b("Ezekiel","ot","ezek","Ezekiel",["Ezek"]),
  b("Daniel","ot","dan","Daniel",["Dan"]),
  b("Hosea","ot","hosea","Hosea",["Hos"]),
  b("Joel","ot","joel","Joel",[]),
  b("Amos","ot","amos","Amos",[]),
  b("Obadiah","ot","obad","Obadiah",["Obad"]),
  b("Jonah","ot","jonah","Jonah",[]),
  b("Micah","ot","micah","Micah",["Mic"]),
  b("Nahum","ot","nahum","Nahum",["Nah"]),
  b("Habakkuk","ot","hab","Habakkuk",["Hab"]),
  b("Zephaniah","ot","zeph","Zephaniah",["Zeph"]),
  b("Haggai","ot","hag","Haggai",["Hag"]),
  b("Zechariah","ot","zech","Zechariah",["Zech"]),
  b("Malachi","ot","mal","Malachi",["Mal"]),
  // New Testament
  b("Matthew","nt","matt","Matthew",["Matt","Mt"]),
  b("Mark","nt","mark","Mark",["Mrk"]),
  b("Luke","nt","luke","Luke",["Lk"]),
  b("John","nt","john","John",["Jn"]),
  b("Acts","nt","acts","Acts",[]),
  b("Romans","nt","rom","Romans",["Rom"]),
  b("1 Corinthians","nt","1-cor","1 Corinthians",["1 Cor"]),
  b("2 Corinthians","nt","2-cor","2 Corinthians",["2 Cor"]),
  b("Galatians","nt","gal","Galatians",["Gal"]),
  b("Ephesians","nt","eph","Ephesians",["Eph"]),
  b("Philippians","nt","philip","Philippians",["Philip","Phil","Phillipians"]),
  b("Colossians","nt","col","Colossians",["Col"]),
  b("1 Thessalonians","nt","1-thes","1 Thessalonians",["1 Thess","1 Thes"]),
  b("2 Thessalonians","nt","2-thes","2 Thessalonians",["2 Thess","2 Thes"]),
  b("1 Timothy","nt","1-tim","1 Timothy",["1 Tim"]),
  b("2 Timothy","nt","2-tim","2 Timothy",["2 Tim"]),
  b("Titus","nt","titus","Titus",[]),
  b("Philemon","nt","philem","Philemon",["Philem","Phlm"]),
  b("Hebrews","nt","heb","Hebrews",["Heb"]),
  b("James","nt","james","James",["Jas"]),
  b("1 Peter","nt","1-pet","1 Peter",["1 Pet","1 Pt"]),
  b("2 Peter","nt","2-pet","2 Peter",["2 Pet","2 Pt"]),
  b("1 John","nt","1-jn","1 John",["1 Jn"]),
  b("2 John","nt","2-jn","2 John",["2 Jn"]),
  b("3 John","nt","3-jn","3 John",["3 Jn"]),
  b("Jude","nt","jude","Jude",[]),
  b("Revelation","nt","rev","Revelation",["Rev","Rev.","Apocalypse"]),
  // Book of Mormon
  b("1 Nephi","bofm","1-ne","1 Nephi",["1 Ne","1 Nep"]),
  b("2 Nephi","bofm","2-ne","2 Nephi",["2 Ne","2 Nep"]),
  b("Jacob","bofm","jacob","Jacob",[]),
  b("Enos","bofm","enos","Enos",[]),
  b("Jarom","bofm","jarom","Jarom",[]),
  b("Omni","bofm","omni","Omni",[]),
  b("Words of Mormon","bofm","w-of-m","Words of Mormon",["W of M","WoM"]),
  b("Mosiah","bofm","mosiah","Mosiah",[]),
  b("Alma","bofm","alma","Alma",[]),
  b("Helaman","bofm","hel","Helaman",["Hel"]),
  b("3 Nephi","bofm","3-ne","3 Nephi",["3 Ne","3 Nep"]),
  b("4 Nephi","bofm","4-ne","4 Nephi",["4 Ne","4 Nep"]),
  b("Mormon","bofm","morm","Mormon",["Morm"]),
  b("Ether","bofm","ether","Ether",[]),
  b("Moroni","bofm","moro","Moroni",["Moro"]),
  // Doctrine and Covenants
  b("D&C","dc-testament","dc","D&C",["Doctrine and Covenants","D. & C.","Doctrine & Covenants"]),
  // Pearl of Great Price
  b("Moses","pgp","moses","Moses",[]),
  b("Abraham","pgp","abr","Abraham",["Abr"]),
  b("Joseph Smith—Matthew","pgp","js-m","Joseph Smith—Matthew",["JS—M","JS-M","Joseph Smith-Matthew"]),
  b("Joseph Smith—History","pgp","js-h","Joseph Smith—History",["JS—H","JS-H","Joseph Smith-History"]),
  b("Articles of Faith","pgp","a-of-f","Articles of Faith",["A of F"]),
];

function b(
  canonical: string,
  vol: string,
  slug: string,
  lookupKey: string,
  aliases: string[],
): BookDef {
  return {
    canonical,
    vol,
    slug,
    source: vol === "bofm" || vol === "dc-testament" || vol === "pgp" ? "lds" : "bible",
    lookupKey,
    aliases,
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest names first so "1 Nephi" wins over a hypothetical "Nephi", etc.
const NAME_TO_BOOK = new Map<string, BookDef>();
for (const book of BOOKS) {
  for (const name of [book.canonical, ...book.aliases]) {
    NAME_TO_BOOK.set(name, book);
  }
}
const ALL_NAMES = [...NAME_TO_BOOK.keys()].sort((a, z) => z.length - a.length);
// A trailing "." is allowed after any alias (e.g. "Matt.").
const NAMES_RE = ALL_NAMES.map(escapeRe).join("|");
const REF_RE = new RegExp(
  `\\b(${NAMES_RE})\\.?\\s+(\\d+)(?::(\\d+)(?:\\s*[–—-]\\s*(\\d+))?)?`,
  "g",
);

export interface ScriptureMatch {
  index: number;
  length: number;
  text: string;
  canonicalRef: string;
  url: string;
  /** For the verse-text API: source, lookup key, chapter, verses. */
  source: "bible" | "lds";
  lookupKey: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

function buildUrl(
  book: BookDef,
  chapter: number,
  v1?: number,
  v2?: number,
): string {
  const base = `https://www.churchofjesuschrist.org/study/scriptures/${book.vol}/${book.slug}/${chapter}?lang=eng`;
  if (!v1) return base;
  const id = v2 && v2 > v1 ? `p${v1}-p${v2}` : `p${v1}`;
  return `${base}&id=${id}#p${v1}`;
}

/** All scripture references in a string, in order. */
export function findReferences(text: string): ScriptureMatch[] {
  const out: ScriptureMatch[] = [];
  REF_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REF_RE.exec(text)) !== null) {
    const book = NAME_TO_BOOK.get(m[1]);
    if (!book) continue;
    const chapter = Number(m[2]);
    const v1 = m[3] ? Number(m[3]) : undefined;
    const v2 = m[4] ? Number(m[4]) : undefined;
    const ref =
      v1 != null
        ? `${book.canonical} ${chapter}:${v1}${v2 ? `–${v2}` : ""}`
        : `${book.canonical} ${chapter}`;
    out.push({
      index: m.index,
      length: m[0].length,
      text: m[0],
      canonicalRef: ref,
      url: buildUrl(book, chapter, v1, v2),
      source: book.source,
      lookupKey: book.lookupKey,
      chapter,
      verseStart: v1,
      verseEnd: v2,
    });
  }
  return out;
}
