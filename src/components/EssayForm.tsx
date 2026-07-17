import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";
import { AnchorFields, type AnchorOption } from "@/components/AnchorFields";
import { ThemeOrderFields } from "@/components/ThemeOrderFields";
import { EssayBodyField } from "@/components/EssayBodyField";
import type { EssayEdit, EssayLinkTarget } from "@/lib/data/essays";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft";

export function EssayForm({
  action,
  editing,
  options,
  themes = [],
  nextOrders = {},
  linkTargets = [],
  error,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  editing?: EssayEdit;
  options: {
    passages: AnchorOption[];
    arrangements: AnchorOption[];
    tenets: AnchorOption[];
  };
  themes?: string[];
  nextOrders?: Record<string, number>;
  linkTargets?: EssayLinkTarget[];
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
        <p className="text-sm text-red-700">A title and body are needed.</p>
      )}
      {error === "save" && (
        <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm text-ink-soft">Title</label>
        <input id="title" name="title" required defaultValue={editing?.title} className={field} />
      </div>

      <div>
        <label htmlFor="dek" className="block text-sm text-ink-soft">
          Subtitle <span className="text-ink-faint">(optional)</span>
        </label>
        <input id="dek" name="dek" defaultValue={editing?.dek} className={field} />
      </div>

      <EssayBodyField
        defaultValue={editing?.body}
        targets={linkTargets}
        placeholder="Write it plainly and lovingly. Markdown is welcome."
        className={`${field} font-serif text-lg leading-relaxed`}
      />

      <div>
        <label htmlFor="byline" className="block text-sm text-ink-soft">
          Byline <span className="text-ink-faint">(optional — credit a guest)</span>
        </label>
        <input
          id="byline"
          name="byline"
          defaultValue={editing?.byline}
          placeholder="e.g. by a friend of the gathering"
          className={field}
        />
      </div>

      <ThemeOrderFields
        themes={themes}
        nextOrders={nextOrders}
        initialTheme={editing?.themeTitle ?? ""}
        initialOrder={editing?.themeOrder}
        editing={Boolean(editing)}
      />

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
          {editing ? "Save changes" : "Save essay"}
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
