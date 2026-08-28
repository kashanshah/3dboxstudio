"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/studio", "/admin", "/preview"];

export default function BuyMeACoffeeWidget() {
  const pathname = usePathname() ?? "";
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (hidden) return null;

  return (
    <Script
      id="bmc-widget"
      strategy="lazyOnload"
      src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
      data-name="BMC-Widget"
      data-cfasync="false"
      data-id="kashanshah"
      data-description="Support 3D Box Studio"
      data-message="Thanks for supporting this free packaging designer"
      data-color="#2563eb"
      data-position="Right"
      data-x_margin="18"
      data-y_margin="18"
    />
  );
}
