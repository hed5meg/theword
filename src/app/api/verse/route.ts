import { NextResponse } from "next/server";
import { getVerseText } from "@/lib/data/verse";

// Verse text for the scripture hover. Called by <ScriptureLink> on hover/focus.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const lookupKey = searchParams.get("key") ?? "";
  const chapter = Number(searchParams.get("ch") ?? 0);
  const v1 = searchParams.get("v1");
  const v2 = searchParams.get("v2");

  if ((source !== "bible" && source !== "lds") || !lookupKey || !chapter) {
    return NextResponse.json({ text: null }, { status: 400 });
  }

  const text = await getVerseText({
    source,
    lookupKey,
    chapter,
    verseStart: v1 ? Number(v1) : undefined,
    verseEnd: v2 ? Number(v2) : undefined,
  });

  return NextResponse.json(
    { text },
    {
      headers: {
        // Cache at the edge; verse text never changes.
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    },
  );
}
