/** TeknoBoards contact form credentials (server-only). */
export function teknoboardsApiKey(): string | null {
  return (
    process.env.TEKNOBOARDS_API_KEY?.trim() ||
    process.env.TEKNOBOARD_FORM_SUBMISSION_TOKEN?.trim() ||
    null
  );
}

export function teknoboardsFormId(): string | null {
  return process.env.TEKNOBOARDS_FORM_ID?.trim() || null;
}

export function teknoboardsConfigError(): string | null {
  const apiKey = teknoboardsApiKey();
  const formId = teknoboardsFormId();

  if (apiKey && formId) return null;

  const missing: string[] = [];
  if (!apiKey) {
    missing.push("TEKNOBOARDS_API_KEY (or TEKNOBOARD_FORM_SUBMISSION_TOKEN)");
  }
  if (!formId) {
    missing.push("TEKNOBOARDS_FORM_ID");
  }

  if (process.env.NODE_ENV === "development") {
    return `Contact form misconfigured: set ${missing.join(" and ")} in .env.local, then restart the dev server.`;
  }

  return "Contact form is not configured yet. Please try again later.";
}
