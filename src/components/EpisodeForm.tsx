import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";
import { AnchorFields, type AnchorOption } from "@/components/AnchorFields";
import type { EpisodeEdit } from "@/lib/data/podcasts";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft";

export function EpisodeForm({
  action,
  editing,
  options,
  error,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  editing?: EpisodeEdit;
  options: {
    passages: AnchorOption[];
    arrangements: AnchorOption[];
    tenets: AnchorOption[];
  };
  error?: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="ui mt-8 space-y-6">
      <IdempotencyField />
      {editing && (
        <>
          <input type="hidden" name="id" value={editing.id} />
          <input type="hidden" name="slug" value={editing.slug} />
        </>
      )}

      {error === "required" && (
        <p className="text-sm text-red-700">A title and an audio link are needed.</p>
      )}
      {error === "save" && (
        <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm text-ink-soft">Title</label>
        <input id="title" name="title" required defaultValue={editing?.title} className={field} />
      </div>

      <div>
        <label htmlFor="audio_url" className="block text-sm text-ink-soft">Audio link</label>
        <input
          id="audio_url"
          name="audio_url"
          required
          type="url"
          defaultValue={editing?.audioUrl}
          placeholder="Spotify, Apple, YouTube, an RSS episode, or a direct .mp3"
          className={field}
        />
        <p className="mt-1 text-xs text-ink-faint">
          Paste an episode link — we render the right player automatically.
        </p>
      </div>

      <div>
        <label htmlFor="series" className="block text-sm text-ink-soft">
          Series <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="series"
          name="series"
          defaultValue={editing?.series}
          placeholder="e.g. Reading Revelation Aloud"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm text-ink-soft">
          Show notes <span className="text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={8}
          defaultValue={editing?.notes}
          placeholder="What this episode holds. Markdown is welcome."
          className={field}
        />
      </div>

      <div>
        <label htmlFor="byline" className="block text-sm text-ink-soft">
          Byline <span className="text-ink-faint">(optional — credit a guest)</span>
        </label>
        <input id="byline" name="byline" defaultValue={editing?.byline} className={field} />
      </div>

      <AnchorFields
        passages={options.passages}
        arrangements={options.arrangements}
        tenets={options.tenets}
        values={
          editing
            ? {
                passageId: editing.passageId,
                arrangementId: editing.arrangementId,
                tenetId: editing.tenetId,
              }
            : undefined
        }
      />

      <div>
        <label htmlFor="status" className="block text-sm text-ink-soft">Visibility</label>
        <select
          id="status"
          name="status"
          defaultValue={editing?.status ?? "draft"}
          className={field}
        >
          <option value="draft">Draft — only stewards can see it</option>
          <option value="published">Published — visible to all</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton
          pendingLabel="Saving…"
          className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
        >
          {editing ? "Save changes" : "Save episode"}
        </SubmitButton>
        <a
          href={cancelHref}
          className="text-sm text-ink-faint transition-colors hover:text-ink-soft"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
