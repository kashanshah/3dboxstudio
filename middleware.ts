import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except api, admin, Next internals, and static files.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
