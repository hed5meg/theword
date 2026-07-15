import { getEssay } from "@/lib/data/essays";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { summarize } from "@/lib/metadata";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "An essay on The Unsealed Revelation";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = await getEssay(slug);
  const sub = essay?.dek || (essay?.body ? summarize(essay.body, 110) : "");
  return ogCard({
    eyebrow: "Essay",
    title: essay?.title ?? "The Unsealed Revelation",
    subtitle: sub,
  });
}
