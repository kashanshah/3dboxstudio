import Link from "next/link";
import type { ReactNode } from "react";
import StudioLink from "@/components/StudioLink";
import { isStudioHref } from "@/lib/blogLinks";

/** Parse light markdown-style links: [label](/path) — only same-site absolute paths. */
export function renderInlineContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    if (isStudioHref(href)) {
      nodes.push(
        <StudioLink key={`lnk-${key++}`} href={href} className="blog-inline-link">
          {label}
        </StudioLink>,
      );
    } else {
      nodes.push(
        <Link key={`lnk-${key++}`} href={href} className="blog-inline-link">
          {label}
        </Link>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
