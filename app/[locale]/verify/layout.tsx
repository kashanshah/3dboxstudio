import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Verify email | 3D Box Studio" },
  description: "Confirm your 3D Box Studio account email address to save and share packaging designs.",
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
