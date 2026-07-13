// Renders the right player for a podcast episode's external audio URL:
// Spotify / Apple / YouTube get a provider iframe; a direct audio file gets a
// native player; anything else falls back to a tidy outbound link.

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function youtubeId(u: URL): string | null {
  if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
  if (u.hostname.endsWith("youtube.com")) {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
  }
  return null;
}

const AUDIO_EXT = /\.(mp3|m4a|ogg|oga|wav|aac|flac)$/i;

export function AudioEmbed({ url }: { url: string }) {
  const u = parse(url);

  const frame = "w-full overflow-hidden rounded-xl border border-line";

  if (u) {
    // Spotify
    if (u.hostname.endsWith("spotify.com")) {
      const src = `https://open.spotify.com/embed${u.pathname}`;
      return (
        <iframe
          title="Spotify player"
          src={src}
          className={frame}
          height={232}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        />
      );
    }
    // Apple Podcasts
    if (u.hostname.endsWith("podcasts.apple.com")) {
      const src = `https://embed.podcasts.apple.com${u.pathname}${u.search}`;
      return (
        <iframe
          title="Apple Podcasts player"
          src={src}
          className={frame}
          height={175}
          loading="lazy"
          allow="autoplay *; encrypted-media *; clipboard-write"
        />
      );
    }
    // YouTube
    const yt = youtubeId(u);
    if (yt) {
      return (
        <div className={`${frame} aspect-video`}>
          <iframe
            title="YouTube player"
            src={`https://www.youtube.com/embed/${yt}`}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    // A direct audio file
    if (AUDIO_EXT.test(u.pathname)) {
      return (
        <audio controls preload="none" src={url} className="w-full">
          <a href={url}>Listen</a>
        </audio>
      );
    }
  }

  // Fallback: a plain outbound link.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ui inline-flex items-center gap-2 rounded-full border border-gold-soft/60 px-5 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-glow"
    >
      Listen ↗
    </a>
  );
}
