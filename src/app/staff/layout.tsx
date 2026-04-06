import "../globals.css";

export const metadata = {
  title: "Coffee Three — Staff",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
