import { ImageResponse } from "next/og";

// A shared Open Graph card (1200×630) for link previews: the gold square-in-
// circle mark, an eyebrow, the page title, and a subtitle, on the warm-dark
// ground. Rendered per-route via each segment's opengraph-image.tsx.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const GOLD = "#e8b04b";
const PARCHMENT = "#ece7de";
const INK_SOFT = "#c9c2b5";
const BG = "#17150f";

export function ogCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          padding: "80px",
          textAlign: "center",
        }}
      >
        {/* Mark */}
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: 999,
            border: `6px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 44,
          }}
        >
          <div style={{ width: 80, height: 80, border: `6px solid ${GOLD}` }} />
        </div>

        {eyebrow && (
          <div
            style={{
              color: GOLD,
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
        )}

        <div
          style={{
            color: PARCHMENT,
            fontSize: title.length > 40 ? 60 : 74,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 1000,
            display: "flex",
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              color: INK_SOFT,
              fontSize: 29,
              lineHeight: 1.35,
              marginTop: 26,
              maxWidth: 880,
              display: "flex",
            }}
          >
            {subtitle.length > 120 ? `${subtitle.slice(0, 120).trimEnd()}…` : subtitle}
          </div>
        )}

        <div
          style={{
            marginTop: 40,
            color: GOLD,
            fontSize: 24,
            letterSpacing: 3,
          }}
        >
          theword.love
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      headers: {
        // Edge-cache the generated card so scrapers get it instantly.
        "cache-control": "public, immutable, no-transform, max-age=86400, s-maxage=604800",
      },
    },
  );
}
