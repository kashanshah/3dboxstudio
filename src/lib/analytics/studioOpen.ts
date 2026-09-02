/** Pure guard for studio_open — mirrors BoxDesigner mount-level ref semantics. */

export function shouldFireStudioOpen(input: {
  alreadyTrackedThisMount: boolean;
  showAuthGate: boolean;
  authLoading: boolean;
  sessionReady: boolean;
}): boolean {
  if (input.alreadyTrackedThisMount) return false;
  if (input.showAuthGate) return false;
  if (input.authLoading) return false;
  if (!input.sessionReady) return false;
  return true;
}
