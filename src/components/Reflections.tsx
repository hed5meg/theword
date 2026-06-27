import Link from "next/link";
import type { ReflectionTarget } from "@/lib/types";
import type { ReflectionNode } from "@/lib/data/reflections";
import { addReflection } from "@/lib/actions/reflections";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function ReflectionForm({
  targetType,
  targetId,
  path,
  parentId,
  placeholder,
  small,
}: {
  targetType: ReflectionTarget;
  targetId: string;
  path: string;
  parentId?: string;
  placeholder: string;
  small?: boolean;
}) {
  return (
    <form action={addReflection} className="ui space-y-3">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="path" value={path} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        name="body"
        required
        rows={small ? 2 : 3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
      />
      <button
        type="submit"
        className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
      >
        {parentId ? "Reply" : "Share a reflection"}
      </button>
    </form>
  );
}

function ReflectionItem({
  node,
  targetType,
  targetId,
  path,
  signedIn,
  depth = 0,
}: {
  node: ReflectionNode;
  targetType: ReflectionTarget;
  targetId: string;
  path: string;
  signedIn: boolean;
  depth?: number;
}) {
  return (
    <li className={depth > 0 ? "ml-5 border-l border-line/70 pl-5" : ""}>
      <div className="rounded-2xl border border-line bg-card/50 p-4">
        <p className="ui mb-1.5 text-xs text-ink-faint">
          {node.authorHandle ? (
            <Link
              href={`/members/${node.authorHandle}`}
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {node.authorName}
            </Link>
          ) : (
            <span className="text-ink-soft">{node.authorName}</span>
          )}
          {node.createdAt && <span> · {formatDate(node.createdAt)}</span>}
        </p>
        <p className="whitespace-pre-line text-ink">{node.body}</p>

        {signedIn && depth === 0 && (
          <details className="ui mt-3 group">
            <summary className="cursor-pointer list-none text-xs text-gold transition-colors hover:text-ink">
              Reply
            </summary>
            <div className="mt-3">
              <ReflectionForm
                targetType={targetType}
                targetId={targetId}
                path={path}
                parentId={node.id}
                placeholder="A gentle reply…"
                small
              />
            </div>
          </details>
        )}
      </div>

      {node.replies.length > 0 && (
        <ul className="mt-3 space-y-3">
          {node.replies.map((child) => (
            <ReflectionItem
              key={child.id}
              node={child}
              targetType={targetType}
              targetId={targetId}
              path={path}
              signedIn={signedIn}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Reflections({
  targetType,
  targetId,
  path,
  signedIn,
  reflections,
}: {
  targetType: ReflectionTarget;
  targetId: string;
  path: string;
  signedIn: boolean;
  reflections: ReflectionNode[];
}) {
  return (
    <section className="mt-16">
      <h2 className="font-serif text-2xl text-ink">Reflections</h2>
      <p className="mt-1.5 text-ink-soft">
        Gentle, in good faith — hold every offering, and one another, with love.
      </p>

      <div className="mt-6">
        {signedIn ? (
          <ReflectionForm
            targetType={targetType}
            targetId={targetId}
            path={path}
            placeholder="Share what you see…"
          />
        ) : (
          <Link
            href={`/signin?next=${encodeURIComponent(path)}`}
            className="ui inline-block rounded-full border border-gold-soft/60 px-5 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-glow"
          >
            Sign in to reflect
          </Link>
        )}
      </div>

      {reflections.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {reflections.map((node) => (
            <ReflectionItem
              key={node.id}
              node={node}
              targetType={targetType}
              targetId={targetId}
              path={path}
              signedIn={signedIn}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-ink-faint">No reflections yet — yours can be the first.</p>
      )}
    </section>
  );
}
