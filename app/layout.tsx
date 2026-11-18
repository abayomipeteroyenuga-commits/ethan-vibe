import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETHAN VIBE — Create. Connect. Compete. Earn.",
  description: "A home for creators, communities, ideas and new opportunities.",
  applicationName: "ETHAN VIBE",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ETHAN VIBE", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#090d1c", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
