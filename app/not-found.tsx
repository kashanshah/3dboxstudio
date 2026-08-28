import type { Metadata } from "next";
import NotFoundPage from "@/views/NotFoundPage";

export const metadata: Metadata = {
  title: {
    absolute: "Page Not Found | 3D Box Studio",
  },
  description:
    "This page could not be found. Return to 3D Box Studio to design free 3D packaging mockups, folding cartons, and mailer boxes in your browser.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return <NotFoundPage />;
}
