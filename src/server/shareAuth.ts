/** Returns the authenticated user id when share creation requires login (future). */
export async function getShareCreatorId(_req: Request): Promise<string | null> {
  return null;
}

export async function assertCanCreateShare(req: Request): Promise<string | null> {
  // Phase 2: require auth and throw if missing.
  return getShareCreatorId(req);
}
