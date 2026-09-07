import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Reset password | 3D Box Studio" },
  description: "Choose a new password for your 3D Box Studio account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
