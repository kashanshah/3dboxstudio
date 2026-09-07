import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import { getLocale } from "next-intl/server";
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
  icons: {
    icon: "/logo-mark.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${outfit.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
