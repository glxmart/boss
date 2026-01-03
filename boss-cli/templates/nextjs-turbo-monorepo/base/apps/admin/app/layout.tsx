import type { Metadata } from "next";
import "@repo/ui/styles";

export const metadata: Metadata = {
  title: "Admin - {{PROJECT_NAME}}",
  description: "Admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
