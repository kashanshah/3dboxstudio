import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import VercelAnalytics from "@/components/VercelAnalytics";
import { createLandingMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  ...createLandingMetadata(),
  title: {
    default: "Free 3D Box Designer & Packaging Mockup Generator | 3D Box Studio",
    template: "%s | 3D Box Studio",
  },
  keywords: [
    "3d box designer",
    "3d box maker",
    "free 3d box maker",
    "online box designer",
    "packaging mockup generator",
    "free packaging mockup",
    "3d packaging simulator",
    "carton mockup",
    "mailer box mockup",
    "3d box studio",
  ],
  icons: {
    icon: "/logo-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${outfit.variable}`}
    >
      <body>
        {children}
        <GoogleAnalytics />
        <VercelAnalytics />
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
      </body>
    </html>
  );
}
