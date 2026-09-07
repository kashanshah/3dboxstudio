import { notFound } from "next/navigation";
import { createShareMetadata } from "@/lib/seo/metadata";
import { isShareToken } from "@/lib/shareUrl";
import { getShareSeoMetaByPreviewToken } from "@/server/shareService";
import StudioClient from "@/components/StudioClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ previewToken: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { previewToken } = await params;
  if (!isShareToken(previewToken)) return {};
  const meta = await getShareSeoMetaByPreviewToken(previewToken);
  if (!meta) return {};
  return createShareMetadata(meta);
}

export default async function PreviewRoute({ params }: PageProps) {
  const { previewToken } = await params;
  if (!isShareToken(previewToken)) notFound();
  return <StudioClient initialPreviewToken={previewToken} viewOnly />;
}
