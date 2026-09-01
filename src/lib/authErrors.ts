export function googleAuthErrorMessage(code: string | null | undefined): string | null {
  switch (code) {
    case "google_denied":
      return "Google sign-in was cancelled.";
    case "google_state":
      return "Google sign-in expired. Please try again.";
    case "google_not_configured":
      return "Google sign-in is not available right now.";
    case "google_invalid":
    case "google_failed":
      return "Google sign-in failed. Please try again.";
    default:
      return code ? "Could not sign in with Google." : null;
  }
}
