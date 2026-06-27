import type { NextConfig } from "next";

// Routing C: passages now live under an arrangement — /read/[arrangement]/[passage].
// Redirect the pre-arrangement URLs:
//   - original love movement/slug  → the-love-ordered-arrangement/<love slug>
//   - canonical KJV movement/slug  → the-canonical-order/<kjv slug>
const LOVE = "the-love-ordered-arrangement";
const CANON = "the-canonical-order";

// [loveMovement, loveSlug, kjvMovement, kjvSlug]
const PASSAGES: [string, string, string, string][] = [
  ["the-opening-of-the-veil", "a-word-before-the-book", "the-revelation-of-jesus-christ", "the-prologue"],
  ["the-mother-and-the-dragon", "the-mother", "the-woman-and-the-dragon", "the-woman-clothed-with-the-sun"],
  ["the-mother-and-the-dragon", "the-war-in-heaven", "the-woman-and-the-dragon", "war-in-heaven"],
  ["the-long-road-home", "the-first-parents-learn-to-see", "the-seven-churches", "the-letter-to-laodicea"],
  ["the-long-road-home", "the-city-that-remembered-early", "the-seven-churches", "the-letter-to-philadelphia"],
  ["the-long-road-home", "the-ones-sent-to-wake-us", "the-seven-churches", "the-letter-to-sardis"],
  ["the-long-road-home", "the-friend-of-god", "the-seven-churches", "the-letter-to-thyatira"],
  ["the-long-road-home", "the-open-heart", "the-seven-churches", "the-letter-to-pergamos"],
  ["the-long-road-home", "the-witnesses", "the-seven-churches", "the-letter-to-smyrna"],
  ["the-long-road-home", "the-harvest-today", "the-seven-churches", "the-letter-to-ephesus"],
  ["the-throne-and-the-scroll", "the-throne-and-the-sealed-word", "the-throne-and-the-seven-seals", "the-throne-and-the-sealed-book"],
  ["the-throne-and-the-scroll", "the-seals-what-the-light-reveals", "the-throne-and-the-seven-seals", "the-opening-of-the-seals"],
  ["the-throne-and-the-scroll", "the-ones-who-stand", "the-throne-and-the-seven-seals", "the-sealed-and-the-great-multitude"],
  ["the-great-waking", "the-trumpets-the-great-waking", "the-seven-trumpets", "the-first-six-trumpets"],
  ["the-great-waking", "the-open-book-and-the-sealed-thunder", "the-seven-trumpets", "the-little-book"],
  ["the-great-waking", "the-two-who-stand-together", "the-seven-trumpets", "the-two-witnesses-and-the-seventh-trumpet"],
  ["the-great-waking", "the-whole-earth-remembers", "the-seven-trumpets", "the-lamb-on-mount-sion-and-the-harvest"],
  ["the-beast-and-babylon", "the-beast-within", "the-beast-and-babylon", "the-two-beasts"],
  ["the-beast-and-babylon", "the-bowls-emptying-the-cup", "the-beast-and-babylon", "the-seven-vials"],
  ["the-beast-and-babylon", "babylon-the-false-bride-falls", "the-beast-and-babylon", "the-fall-of-babylon"],
  ["the-homecoming", "the-marriage-of-the-lamb", "the-new-heaven-and-the-new-earth", "the-marriage-of-the-lamb"],
  ["the-homecoming", "the-dragon-bound-and-death-undone", "the-new-heaven-and-the-new-earth", "the-thousand-years-and-the-last-judgment"],
  ["the-homecoming", "the-city-home", "the-new-heaven-and-the-new-earth", "the-new-jerusalem"],
];

function buildRedirects() {
  const out: { source: string; destination: string; statusCode: 301 }[] = [];
  const seen = new Set<string>();
  const add = (source: string, destination: string) => {
    if (seen.has(source)) return;
    seen.add(source);
    out.push({ source, destination, statusCode: 301 });
  };
  for (const [loveMov, loveSlug, kjvMov, kjvSlug] of PASSAGES) {
    add(`/read/${loveMov}/${loveSlug}`, `/read/${LOVE}/${loveSlug}`);
    add(`/read/${kjvMov}/${kjvSlug}`, `/read/${CANON}/${kjvSlug}`);
    // Movement index pages → their arrangement's table of contents.
    add(`/read/${loveMov}`, `/read/${LOVE}`);
    add(`/read/${kjvMov}`, `/read/${CANON}`);
  }
  return out;
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./docs/**/*"],
  },
  async redirects() {
    return buildRedirects();
  },
};

export default nextConfig;
