import { StudioThemeShell } from "@/components/studio/StudioThemeProvider";
import { studioThemeInitScript } from "./theme-init";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: studioThemeInitScript }} />
      <StudioThemeShell>{children}</StudioThemeShell>
    </>
  );
}
