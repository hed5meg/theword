import { getEpisode } from "@/lib/data/podcasts";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "An episode on The Unsealed Revelation";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  return ogCard({
    eyebrow: "Podcast",
    title: ep?.title ?? "Podcasts",
    subtitle: ep?.series ?? "",
  });
}
