import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { rehypeScripture } from "@/lib/rehype-scripture";
import { ScriptureLink } from "@/components/ScriptureLink";

/**
 * Renders sanitized Markdown in the reverent prose style. Used for rendering
 * bodies and tenet text — anything contributors may one day author.
 *
 * With `scripture`, references to the standard works are auto-linked to Gospel
 * Library, with a hover preview of the verse (used for essays and show notes).
 */

// Scripture-ref anchors render as ScriptureLink; all other links stay plain.
const scriptureComponents: Components = {
  a(props) {
    const cls = props.className;
    const isRef =
      typeof cls === "string"
        ? cls.split(/\s+/).includes("scripture-ref")
        : false;
    if (isRef) return <ScriptureLink {...props} />;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { node, ...rest } = props;
    return <a {...rest} />;
  },
};

export function Prose({
  children,
  className = "",
  scripture = false,
}: {
  children: string;
  className?: string;
  scripture?: boolean;
}) {
  return (
    <div className={`prose-reverent ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={scripture ? [rehypeSanitize, rehypeScripture] : [rehypeSanitize]}
        components={scripture ? scriptureComponents : undefined}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
