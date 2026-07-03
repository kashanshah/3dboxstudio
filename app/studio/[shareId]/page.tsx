import { notFound } from "next/navigation";
import { createShareMetadata } from "@/lib/seo/metadata";
import { isShareToken } from "@/lib/shareUrl";
import { getShareSeoMeta } from "@/server/shareService";
import StudioClient from "@/components/StudioClient";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { shareId } = await params;
  if (!isShareToken(shareId)) return {};
  const meta = await getShareSeoMeta(shareId);
  if (!meta) return {};
  return createShareMetadata(meta);
}

export default async function StudioShareRoute({ params }: PageProps) {
  const { shareId } = await params;
  if (!isShareToken(shareId)) notFound();
  return <StudioClient initialShareId={shareId} />;
}
