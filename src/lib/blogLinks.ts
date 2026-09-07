/** True for Studio destinations that should use StudioLink tracking. */
export function isStudioHref(href: string): boolean {
  return href === "/studio" || href.startsWith("/studio?");
}
