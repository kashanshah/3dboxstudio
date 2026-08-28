"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { preloadStudioChunk } from "@/lib/preloadStudio";

type StudioLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: ComponentProps<typeof Link>["href"];
  children: ReactNode;
};

/** Studio navigation link that preloads the WebGL editor chunk on hover/focus. */
export default function StudioLink({
  children,
  href = "/studio",
  onMouseEnter,
  onFocus,
  ...props
}: StudioLinkProps) {
  return (
    <Link
      href={href}
      onMouseEnter={(event) => {
        preloadStudioChunk();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        preloadStudioChunk();
        onFocus?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
