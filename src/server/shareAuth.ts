import { ShareError } from "./shareService";
import { getCurrentUser } from "./auth/session";

/** Returns the signed-in user id, or null when anonymous. */
export async function getShareCreatorId(_req: Request): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Guards write access to shares/projects. Requires a signed-in, email-verified user
 * and returns their id. Anonymous users can design locally but cannot save/share.
 */
export async function assertCanCreateShare(_req: Request): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ShareError("Please sign in to save or share designs.", 401);
  }
  if (!user.emailVerified) {
    throw new ShareError("Please verify your email to save or share designs.", 403);
  }
  return user.id;
}
