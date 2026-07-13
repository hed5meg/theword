import type { FeedEpisode } from "@/lib/rss";
import { formatDuration } from "@/lib/rss";

function fmtDate(raw?: string): string {
  if (!raw) return "";
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(t));
  } catch {
    return "";
  }
}

/** One feed episode: title, meta, native player, and its notes. */
export function EpisodePlayer({ episode }: { episode: FeedEpisode }) {
  const dur = formatDuration(episode.duration);
  const date = fmtDate(episode.pubDate);
  return (
    <article className="rounded-2xl border border-line bg-card/50 p-5 sm:p-6">
      <h3 className="font-serif text-xl text-ink">{episode.title}</h3>
      {(date || dur) && (
        <p className="ui mt-1 text-xs uppercase tracking-wider text-ink-faint">
          {date}
          {date && dur ? " · " : ""}
          {dur}
        </p>
      )}

      {episode.audioUrl ? (
        <audio
          controls
          preload="none"
          src={episode.audioUrl}
          className="mt-4 w-full"
        >
          <a href={episode.audioUrl}>Download audio</a>
        </audio>
      ) : (
        episode.link && (
          <a
            href={episode.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ui mt-4 inline-flex rounded-full border border-gold-soft/60 px-5 py-2 text-sm text-gold hover:bg-glow"
          >
            Listen ↗
          </a>
        )
      )}

      {episode.description && (
        <p className="mt-4 whitespace-pre-line text-[0.97rem] leading-relaxed text-ink-soft">
          {episode.description.length > 420
            ? `${episode.description.slice(0, 420)}…`
            : episode.description}
        </p>
      )}
    </article>
  );
}
