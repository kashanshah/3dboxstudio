import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import StudioPage from "./pages/StudioPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/studio" element={<StudioPage />} />
    </Routes>
  );
}
