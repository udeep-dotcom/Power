import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "HydroTrack Nepal — Hydropower Reporting",
  description: "Modern generation reporting and analytics platform for Nepal's Independent Power Producers.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0f1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full bg-[#0a0f1a] text-white">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
