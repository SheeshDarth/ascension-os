import type { Metadata, Viewport } from "next";
import { PwaRuntime } from "@/components/PwaRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "AscensionOS",
  description: "Proof over potential.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AscensionOS"
  },
  applicationName: "AscensionOS",
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030507",
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRuntime />
      </body>
    </html>
  );
}
