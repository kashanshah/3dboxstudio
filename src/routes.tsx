import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

const StudioPage = lazy(() => import("./pages/StudioPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<StudioPage />} />
      </Routes>
    </Suspense>
  );
}
