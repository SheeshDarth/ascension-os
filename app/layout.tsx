import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AscensionOS",
  description: "Proof over potential."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
