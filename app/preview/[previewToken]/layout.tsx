export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
