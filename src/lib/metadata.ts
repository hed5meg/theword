import type { Metadata } from "next";

/**
 * Per-page metadata with matching Open Graph + Twitter tags, so a pasted link
 * unfurls with THAT page's title and summary (not the generic site card).
 * The site's opengraph-image and metadataBase (root layout) fill in the rest.
 */
export function pageMeta({
  title,
  description,
  pathname,
  type = "website",
}: {
  title: string;
  description?: string;
  pathname: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      title,
      description,
      url: pathname,
      type,
      siteName: "The Unsealed Revelation",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image.png"],
    },
  };
}

/** Trim Markdown/body text into a plain one-line summary for previews. */
export function summarize(text: string, max = 180): string {
  const plain = text
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
