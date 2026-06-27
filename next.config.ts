import type { NextConfig } from "next";

// 301 redirects from the pre-rename /read URLs to the canonical KJV slugs.
// Both path segments (movement + passage) changed for most passages.
const READ_REDIRECTS: { from: string; to: string }[] = [
  // Movement index URLs
  { from: "the-opening-of-the-veil", to: "the-revelation-of-jesus-christ" },
  { from: "the-mother-and-the-dragon", to: "the-woman-and-the-dragon" },
  { from: "the-long-road-home", to: "the-seven-churches" },
  { from: "the-throne-and-the-scroll", to: "the-throne-and-the-seven-seals" },
  { from: "the-great-waking", to: "the-seven-trumpets" },
  { from: "the-homecoming", to: "the-new-heaven-and-the-new-earth" },
  // Passage URLs (old movement/passage → new movement/passage)
  { from: "the-opening-of-the-veil/a-word-before-the-book", to: "the-revelation-of-jesus-christ/the-prologue" },
  { from: "the-mother-and-the-dragon/the-mother", to: "the-woman-and-the-dragon/the-woman-clothed-with-the-sun" },
  { from: "the-mother-and-the-dragon/the-war-in-heaven", to: "the-woman-and-the-dragon/war-in-heaven" },
  { from: "the-long-road-home/the-first-parents-learn-to-see", to: "the-seven-churches/the-letter-to-laodicea" },
  { from: "the-long-road-home/the-city-that-remembered-early", to: "the-seven-churches/the-letter-to-philadelphia" },
  { from: "the-long-road-home/the-ones-sent-to-wake-us", to: "the-seven-churches/the-letter-to-sardis" },
  { from: "the-long-road-home/the-friend-of-god", to: "the-seven-churches/the-letter-to-thyatira" },
  { from: "the-long-road-home/the-open-heart", to: "the-seven-churches/the-letter-to-pergamos" },
  { from: "the-long-road-home/the-witnesses", to: "the-seven-churches/the-letter-to-smyrna" },
  { from: "the-long-road-home/the-harvest-today", to: "the-seven-churches/the-letter-to-ephesus" },
  { from: "the-throne-and-the-scroll/the-throne-and-the-sealed-word", to: "the-throne-and-the-seven-seals/the-throne-and-the-sealed-book" },
  { from: "the-throne-and-the-scroll/the-seals-what-the-light-reveals", to: "the-throne-and-the-seven-seals/the-opening-of-the-seals" },
  { from: "the-throne-and-the-scroll/the-ones-who-stand", to: "the-throne-and-the-seven-seals/the-sealed-and-the-great-multitude" },
  { from: "the-great-waking/the-trumpets-the-great-waking", to: "the-seven-trumpets/the-first-six-trumpets" },
  { from: "the-great-waking/the-open-book-and-the-sealed-thunder", to: "the-seven-trumpets/the-little-book" },
  { from: "the-great-waking/the-two-who-stand-together", to: "the-seven-trumpets/the-two-witnesses-and-the-seventh-trumpet" },
  { from: "the-great-waking/the-whole-earth-remembers", to: "the-seven-trumpets/the-lamb-on-mount-sion-and-the-harvest" },
  { from: "the-beast-and-babylon/the-beast-within", to: "the-beast-and-babylon/the-two-beasts" },
  { from: "the-beast-and-babylon/the-bowls-emptying-the-cup", to: "the-beast-and-babylon/the-seven-vials" },
  { from: "the-beast-and-babylon/babylon-the-false-bride-falls", to: "the-beast-and-babylon/the-fall-of-babylon" },
  { from: "the-homecoming/the-marriage-of-the-lamb", to: "the-new-heaven-and-the-new-earth/the-marriage-of-the-lamb" },
  { from: "the-homecoming/the-dragon-bound-and-death-undone", to: "the-new-heaven-and-the-new-earth/the-thousand-years-and-the-last-judgment" },
  { from: "the-homecoming/the-city-home", to: "the-new-heaven-and-the-new-earth/the-new-jerusalem" },
];

const nextConfig: NextConfig = {
  // The seed content lives as Markdown read at build time. Trace these files so
  // they are bundled with any server function that might read them at runtime.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./docs/**/*"],
  },
  async redirects() {
    return READ_REDIRECTS.map(({ from, to }) => ({
      source: `/read/${from}`,
      destination: `/read/${to}`,
      statusCode: 301,
    }));
  },
};

export default nextConfig;
