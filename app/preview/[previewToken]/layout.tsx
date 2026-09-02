import { StudioThemeShell } from "@/components/studio/StudioThemeProvider";
import { studioThemeInitScript } from "../../studio/theme-init";

export default function PreviewLayout({
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
