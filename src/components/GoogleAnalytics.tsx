"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function GoogleAnalytics() {
  const pathname = usePathname();

  if (!GA_ID || isAdminPath(pathname)) return null;

  return <NextGoogleAnalytics gaId={GA_ID} />;
}
