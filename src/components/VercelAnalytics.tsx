"use client";

import { Analytics } from "@vercel/analytics/next";

export default function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const { pathname } = new URL(event.url);
        if (pathname === "/admin" || pathname.startsWith("/admin/")) {
          return null;
        }
        return event;
      }}
    />
  );
}
