import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { rehypeScripture } from "@/lib/rehype-scripture";
import { rehypeAnchors, rehypeWikiLinks } from "@/lib/rehype-essay";
import { ScriptureLink } from "@/components/ScriptureLink";

/**
 * Renders sanitized Markdown in the reverent prose style.
 *
 * - `scripture`: auto-link standard-works references to Gospel Library (hover).
 * - `anchors`: give headings ids + honor explicit {#id} anchors on any block.
 * - `essayLinks`: a slug→title map enabling [[slug#anchor|label]] cross-links.
 */

// Scripture refs render as ScriptureLink; internal links as client-side Link.
const enhancedComponents: Components = {
  a(props) {
    const className = typeof props.className === "string" ? props.className : "";
    if (className.split(/\s+/).includes("scripture-ref")) {
      return <ScriptureLink {...props} />;
    }
    const { href = "", children } = props;
    if (typeof href === "string" && href.startsWith("/")) {
      return (
        <Link href={href} className={className || undefined}>
          {children}
        </Link>
      );
    }
    return (
      <a href={typeof href === "string" ? href : undefined} className={className || undefined}>
        {children}
      </a>
    );
  },
};

export function Prose({
  children,
  className = "",
  scripture = false,
  anchors = false,
  essayLinks,
}: {
  children: string;
  className?: string;
  scripture?: boolean;
  anchors?: boolean;
  essayLinks?: Record<string, string>;
}) {
  const enhanced = scripture || anchors || Boolean(essayLinks);
  const rehypePlugins: PluggableList = [rehypeSanitize];
  if (anchors) rehypePlugins.push(rehypeAnchors);
  if (essayLinks) rehypePlugins.push([rehypeWikiLinks, essayLinks]);
  if (scripture) rehypePlugins.push(rehypeScripture);

  return (
    <div className={`prose-reverent ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={enhanced ? enhancedComponents : undefined}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
