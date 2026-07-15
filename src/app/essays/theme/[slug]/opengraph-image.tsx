import { getThemeMeta } from "@/lib/data/essay-themes";
import { listEssays } from "@/lib/data/essays";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "A theme on The Unsealed Revelation";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [theme, all] = await Promise.all([getThemeMeta(slug), listEssays()]);
  const inTheme = all.filter((e) => e.themeSlug === slug);
  const sub =
    theme?.description ||
    (inTheme.length
      ? `${inTheme.length} ${inTheme.length === 1 ? "essay" : "essays"}`
      : "");
  return ogCard({
    eyebrow: "A theme",
    title: theme?.title ?? "Essays",
    subtitle: sub,
  });
}
