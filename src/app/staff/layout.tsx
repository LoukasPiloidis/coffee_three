import "../globals.css";

export const metadata = {
  title: "Coffee Three — Προσωπικό",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
