/**
 * Block common disposable / temporary email providers at signup and email change.
 * Domains are matched on the registrable host (including subdomains).
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "emailfake.com",
  "fakeinbox.com",
  "getnada.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "harakirimail.com",
  "inboxbear.com",
  "maildrop.cc",
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  "mailnesia.com",
  "mailcatch.com",
  "mail.tm",
  "mailsac.com",
  "mintemail.com",
  "minuteinbox.com",
  "mohmal.com",
  "mytemp.email",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmail.net",
  "tempmailo.com",
  "tempr.email",
  "throwaway.email",
  "tmpmail.net",
  "tmpmail.org",
  "trashmail.com",
  "trashmail.de",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

export function getEmailDomain(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) return "";
  return normalized.slice(at + 1);
}

export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;

  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }

  return false;
}

export const DISPOSABLE_EMAIL_ERROR =
  "Temporary email addresses are not allowed. Please use a permanent email address.";
