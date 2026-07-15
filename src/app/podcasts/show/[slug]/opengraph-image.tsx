import { getShow } from "@/lib/data/podcast-feeds";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { summarize } from "@/lib/metadata";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "A show on The Unsealed Revelation";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const show = await getShow(slug);
  return ogCard({
    eyebrow: "Podcast",
    title: show?.title ?? "Podcasts",
    subtitle: show?.feed.description ? summarize(show.feed.description, 110) : "",
  });
}
