import { notFound } from "next/navigation";
import { createShareMetadata } from "@/lib/seo/metadata";
import { isShareToken } from "@/lib/shareUrl";
import { getShareOwnerId, getShareSeoMeta } from "@/server/shareService";
import { getCurrentUser } from "@/server/auth/session";
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

  // Only the verified owner can edit; everyone else opens the project read-only.
  const [ownerId, user] = await Promise.all([getShareOwnerId(shareId), getCurrentUser()]);
  if (ownerId === undefined) notFound();

  const isOwner = Boolean(user?.emailVerified && ownerId && user.id === ownerId);

  return <StudioClient initialShareId={shareId} viewOnly={!isOwner} />;
}
