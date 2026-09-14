import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import NotFoundPage from "@/views/NotFoundPage";

export const metadata: Metadata = {
  title: "Page Not Found | 3D Box Studio",
  description:
    "This page could not be found. Return to 3D Box Studio to design free 3D packaging mockups, folding cartons, and mailer boxes in your browser.",
  robots: {
    index: false,
    follow: true,
  },
};

/**
 * Root-level fallback for paths that do not reach a valid `[locale]` route.
 *
 * These requests render outside `app/[locale]/layout.tsx`, so they need their
 * own provider before reusing the translated site shell and branded 404 view.
 */
export default async function RootNotFound() {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>
  );
}
