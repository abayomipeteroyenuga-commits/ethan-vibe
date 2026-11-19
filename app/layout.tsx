import type { Metadata, Viewport } from "next";
import PwaInstall from "@/app/components/pwa-install";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETHAN VIBE — Create. Connect. Compete. Earn.",
  description: "A home for creators, communities, ideas and new opportunities.",
  applicationName: "ETHAN VIBE",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/vibe-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/vibe-icon.svg", type: "image/svg+xml" }]
  },
  appleWebApp: { capable: true, title: "ETHAN VIBE", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#090d1c", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-title" content="ETHAN VIBE" /></head><body>{children}<PwaInstall /></body></html>;
}