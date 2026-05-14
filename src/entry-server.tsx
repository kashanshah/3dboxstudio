import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { prerenderConfig } from "../prerender.config";
import LandingPage from "./pages/LandingPage";

const prerenderRouteElements: Partial<
  Record<(typeof prerenderConfig.prerender)[number], JSX.Element>
> = {
  "/": <LandingPage />,
};

export function renderPrerenderRoute(route: string): string {
  const element = prerenderRouteElements[route as keyof typeof prerenderRouteElements];
  if (!element) {
    throw new Error(`No prerender renderer registered for route "${route}".`);
  }

  return renderToString(
    <StrictMode>
      <StaticRouter location={route}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </StaticRouter>
    </StrictMode>,
  );
}
